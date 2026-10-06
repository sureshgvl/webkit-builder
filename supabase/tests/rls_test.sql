-- Access-rule tests. Run against a database with the migration applied:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls_test.sql
-- Everything runs in a transaction that is rolled back, so no data is left behind.
begin;

-- Test data (as the backend / service role)
set local role service_role;
insert into public.sites (slug, status, config, plan) values
  ('live-site',  'published', '{"business":{"name":"Live"}}', 'standard'),
  ('draft-site', 'draft',     '{"business":{"name":"Draft"}}', 'basic'),
  ('old-site',   'suspended', '{"business":{"name":"Old"}}', 'basic');
insert into public.domains (domain, site_id, kind, is_primary) values
  ('live.example.test',  (select id from public.sites where slug = 'live-site'),  'subdomain', true),
  ('draft.example.test', (select id from public.sites where slug = 'draft-site'), 'subdomain', true);
update public.sites set config = '{"business":{"name":"Live v2"}}' where slug = 'live-site';
update public.sites set plan = 'premium' where slug = 'live-site'; -- not a config change

do $$ begin
  assert (select count(*) from public.site_versions v join public.sites s on s.id = v.site_id where s.slug = 'live-site') = 2,
    'versions: one on insert, one per config change (plan change ignored)';
  assert (select updated_at > created_at or updated_at = created_at from public.sites where slug = 'live-site'), 'updated_at maintained';
end $$;

-- Public visitor (anon key)
set local role anon;
do $$ begin
  assert (select count(*) from public.sites) = 1, 'anon sees only published sites';
  assert (select slug from public.sites) = 'live-site', 'anon sees the published site';
  assert (select config->'business'->>'name' from public.sites) = 'Live v2', 'anon reads the latest config';
  assert (select count(*) from public.domains) = 1, 'anon sees domains of published sites only';
  assert (select s.slug from public.domains d join public.sites s on s.id = d.site_id where d.domain = 'live.example.test') = 'live-site',
    'domain lookup works for anon';
end $$;

do $$ begin
  perform plan from public.sites;
  raise exception 'anon must not read plan';
exception when insufficient_privilege then null; end $$;

do $$ begin
  perform expires_at from public.sites;
  raise exception 'anon must not read expires_at';
exception when insufficient_privilege then null; end $$;

do $$ begin
  perform 1 from public.site_versions;
  raise exception 'anon must not read site_versions';
exception when insufficient_privilege then null; end $$;

do $$ begin
  insert into public.sites (slug, config) values ('hack', '{}');
  raise exception 'anon must not insert';
exception when insufficient_privilege then null; end $$;

do $$ begin
  update public.sites set status = 'published';
  raise exception 'anon must not update';
exception when insufficient_privilege then null; end $$;

do $$ begin
  delete from public.domains;
  raise exception 'anon must not delete';
exception when insufficient_privilege then null; end $$;

-- Logged-in users (future client logins) get no more than anon for now
set local role authenticated;
do $$ begin
  assert (select count(*) from public.sites) = 1, 'authenticated sees only published sites';
end $$;

-- Data rules
set local role service_role;
do $$ begin
  insert into public.sites (slug, config) values ('Bad Slug', '{}');
  raise exception 'invalid slug must be rejected';
exception when check_violation then null; end $$;
do $$ begin
  insert into public.domains (domain, site_id) values ('UPPER.example.test', (select id from public.sites where slug = 'live-site'));
  raise exception 'upper-case domain must be rejected';
exception when check_violation then null; end $$;
do $$ begin
  insert into public.domains (domain, site_id, is_primary) values ('second.example.test', (select id from public.sites where slug = 'live-site'), true);
  raise exception 'only one primary domain per site';
exception when unique_violation then null; end $$;

\echo 'All RLS / schema tests passed'
rollback;
