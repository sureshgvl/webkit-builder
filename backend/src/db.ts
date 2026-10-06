import pg from "pg";

export type SiteStatus = "draft" | "published" | "suspended";

export type SiteRow = {
  id: string;
  slug: string;
  status: SiteStatus;
  config: Record<string, unknown>;
  plan: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export type DomainRow = { domain: string; site_id: string; kind: "subdomain" | "custom"; is_primary: boolean; verified: boolean; created_at: string };
export type VersionRow = { id: number; created_at: string; note: string | null; created_by: string | null };

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Direct Postgres access for the backend (Supabase "session pooler" connection string). The backend is the only
 * writer; it connects as the database owner, so Row Level Security does not limit it.
 */
export class Db {
  readonly pool: pg.Pool;

  constructor(connectionString: string) {
    this.pool = new pg.Pool({
      connectionString,
      max: 5,
      // Supabase requires TLS; local test databases don't.
      ssl: /localhost|127\.0\.0\.1|host=\/|sslmode=disable/.test(connectionString) ? undefined : { rejectUnauthorized: false },
    });
  }

  async close() {
    await this.pool.end();
  }

  async listSites(): Promise<(SiteRow & { domains: { domain: string; is_primary: boolean }[] })[]> {
    const { rows } = await this.pool.query(
      `select s.*, coalesce(json_agg(json_build_object('domain', d.domain, 'is_primary', d.is_primary) order by d.is_primary desc, d.domain)
              filter (where d.domain is not null), '[]') as domains
         from public.sites s left join public.domains d on d.site_id = s.id
        group by s.id order by s.updated_at desc`,
    );
    return rows;
  }

  async getSite(slug: string): Promise<SiteRow> {
    const { rows } = await this.pool.query(`select * from public.sites where slug = $1`, [slug]);
    if (!rows[0]) throw new HttpError(404, `Site "${slug}" not found`);
    return rows[0];
  }

  async createSite(slug: string, config: unknown, createdBy: string, subdomain?: string): Promise<SiteRow> {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const { rows } = await client.query(`insert into public.sites (slug, config) values ($1, $2) returning *`, [slug, config]).catch((e) => {
        if (e.code === "23505") throw new HttpError(409, `A site called "${slug}" already exists`);
        throw e;
      });
      await client.query(`update public.site_versions set created_by = $2, note = 'created' where site_id = $1`, [rows[0].id, createdBy]);
      if (subdomain) {
        await client
          .query(`insert into public.domains (domain, site_id, kind, is_primary, verified) values ($1, $2, 'subdomain', true, true)`, [subdomain, rows[0].id])
          .catch((e) => {
            if (e.code === "23505") throw new HttpError(409, `${subdomain} is already used by another site`);
            throw e;
          });
      }
      await client.query("commit");
      return rows[0];
    } catch (e) {
      await client.query("rollback");
      throw e;
    } finally {
      client.release();
    }
  }

  async saveConfig(slug: string, config: unknown, by: string, note?: string): Promise<SiteRow> {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const { rows } = await client.query(`update public.sites set config = $2 where slug = $1 returning *`, [slug, config]);
      if (!rows[0]) throw new HttpError(404, `Site "${slug}" not found`);
      // The trigger added a version row if the config changed; label it.
      await client.query(
        `update public.site_versions set created_by = $2, note = $3
          where id = (select max(id) from public.site_versions where site_id = $1) and created_by is null`,
        [rows[0].id, by, note ?? null],
      );
      await client.query("commit");
      return rows[0];
    } catch (e) {
      await client.query("rollback");
      throw e;
    } finally {
      client.release();
    }
  }

  async setStatus(slug: string, status: SiteStatus): Promise<SiteRow> {
    const { rows } = await this.pool.query(
      `update public.sites set status = $2, published_at = case when $2 = 'published' then now() else published_at end
        where slug = $1 returning *`,
      [slug, status],
    );
    if (!rows[0]) throw new HttpError(404, `Site "${slug}" not found`);
    return rows[0];
  }

  async domains(siteId: string): Promise<DomainRow[]> {
    const { rows } = await this.pool.query(`select * from public.domains where site_id = $1 order by is_primary desc, domain`, [siteId]);
    return rows;
  }

  async addDomain(siteId: string, domain: string, kind: "subdomain" | "custom"): Promise<DomainRow> {
    const existing = await this.pool.query(`select site_id from public.domains where domain = $1`, [domain]);
    if (existing.rows[0]) {
      throw new HttpError(409, existing.rows[0].site_id === siteId ? `${domain} is already added` : `${domain} belongs to another site`);
    }
    const { rows } = await this.pool.query(
      `insert into public.domains (domain, site_id, kind, is_primary, verified)
       values ($1, $2, $3, not exists (select 1 from public.domains where site_id = $2 and is_primary), $3 = 'subdomain')
       returning *`,
      [domain, siteId, kind],
    );
    return rows[0];
  }

  async removeDomain(siteId: string, domain: string): Promise<DomainRow> {
    const { rows } = await this.pool.query(`delete from public.domains where site_id = $1 and domain = $2 returning *`, [siteId, domain]);
    if (!rows[0]) throw new HttpError(404, `${domain} is not linked to this site`);
    // Keep one primary address if any remain.
    await this.pool.query(
      `update public.domains set is_primary = true
        where domain = (select domain from public.domains where site_id = $1 order by kind = 'custom' desc, created_at limit 1)
          and not exists (select 1 from public.domains where site_id = $1 and is_primary)`,
      [siteId],
    );
    return rows[0];
  }

  async setDomainVerified(domain: string, verified: boolean) {
    await this.pool.query(`update public.domains set verified = $2 where domain = $1`, [domain, verified]);
  }

  async versions(siteId: string, limit = 50): Promise<VersionRow[]> {
    const { rows } = await this.pool.query(
      `select id, created_at, note, created_by from public.site_versions where site_id = $1 order by id desc limit $2`,
      [siteId, limit],
    );
    return rows;
  }

  async version(siteId: string, id: number): Promise<{ config: unknown } & VersionRow> {
    const { rows } = await this.pool.query(`select * from public.site_versions where site_id = $1 and id = $2`, [siteId, id]);
    if (!rows[0]) throw new HttpError(404, "Version not found");
    return rows[0];
  }
}
