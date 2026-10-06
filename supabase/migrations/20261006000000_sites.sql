-- Averix sites platform: one row per client website.
-- Websites (Vercel) read published sites with the public "anon" key; Row Level Security limits that to
-- published sites and safe columns. All writes go through the backend (Render) with the service key.

create extension if not exists pgcrypto;

create table public.sites (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  status        text not null default 'draft' check (status in ('draft', 'published', 'suspended')),
  -- Same shape as clients/<slug>/site.json; validated by the app before saving.
  config        jsonb not null,
  plan          text not null default 'basic',
  expires_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  published_at  timestamptz
);

-- Every web address that shows a site: free subdomains and clients' own domains.
create table public.domains (
  domain      text primary key check (domain = lower(domain) and domain ~ '^[a-z0-9.-]+$'),
  site_id     uuid not null references public.sites (id) on delete cascade,
  kind        text not null default 'custom' check (kind in ('subdomain', 'custom')),
  is_primary  boolean not null default false,
  verified    boolean not null default false,
  created_at  timestamptz not null default now()
);
create index domains_site_id_idx on public.domains (site_id);
create unique index domains_one_primary_idx on public.domains (site_id) where is_primary;

-- Every saved config, so any change can be undone.
create table public.site_versions (
  id          bigserial primary key,
  site_id     uuid not null references public.sites (id) on delete cascade,
  config      jsonb not null,
  note        text,
  created_by  text,
  created_at  timestamptz not null default now()
);
create index site_versions_site_id_idx on public.site_versions (site_id, created_at desc);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;
create trigger sites_touch before update on public.sites for each row execute function public.touch_updated_at();

-- Keep a version for every config change (also the first one).
create or replace function public.record_site_version() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' or new.config is distinct from old.config then
    insert into public.site_versions (site_id, config) values (new.id, new.config);
  end if;
  return new;
end $$;
create trigger sites_version after insert or update on public.sites for each row execute function public.record_site_version();

-- ---------------------------------------------------------------- access rules
alter table public.sites enable row level security;
alter table public.domains enable row level security;
alter table public.site_versions enable row level security;

-- Public (anon) and logged-in users: read-only, published sites only, safe columns only.
revoke all on public.sites, public.domains, public.site_versions from anon, authenticated;
grant select (id, slug, status, config, updated_at) on public.sites to anon, authenticated;
grant select (domain, site_id, kind, is_primary) on public.domains to anon, authenticated;

create policy "published sites are public" on public.sites
  for select to anon, authenticated using (status = 'published');

create policy "domains of published sites are public" on public.domains
  for select to anon, authenticated
  using (exists (select 1 from public.sites s where s.id = site_id and s.status = 'published'));

-- site_versions: no policy → only the service role (backend) can read or write.
