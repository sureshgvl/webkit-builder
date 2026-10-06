/**
 * Connects clients' own domains to the website project on Vercel (REST API, token from Vercel → Settings → Tokens).
 * Optional: without VERCEL_TOKEN the domain is only saved in the database and must be added in Vercel by hand.
 */
export type DomainCheck = { configured: boolean; verified: boolean; instructions: { type: string; name: string; value: string }[]; error?: string };

export class VercelDomains {
  constructor(
    private token: string,
    private projectId: string,
    private teamId?: string,
  ) {}

  private q() {
    return this.teamId ? `?teamId=${encodeURIComponent(this.teamId)}` : "";
  }

  private async call(method: string, path: string, body?: unknown) {
    const res = await fetch(`https://api.vercel.com${path}${this.q()}`, {
      method,
      headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown> & { error?: { code?: string; message?: string } };
    return { ok: res.ok, status: res.status, json };
  }

  async add(domain: string): Promise<string | null> {
    const r = await this.call("POST", `/v10/projects/${encodeURIComponent(this.projectId)}/domains`, { name: domain });
    if (r.ok || r.json.error?.code === "domain_already_in_use_by_project") return null;
    return r.json.error?.message ?? `Vercel error ${r.status}`;
  }

  async remove(domain: string): Promise<void> {
    await this.call("DELETE", `/v9/projects/${encodeURIComponent(this.projectId)}/domains/${encodeURIComponent(domain)}`);
  }

  /** What the client must set at their domain seller, and whether it is done. */
  async check(domain: string): Promise<DomainCheck> {
    const [d, cfg] = await Promise.all([
      this.call("GET", `/v9/projects/${encodeURIComponent(this.projectId)}/domains/${encodeURIComponent(domain)}`),
      this.call("GET", `/v6/domains/${encodeURIComponent(domain)}/config`),
    ]);
    if (!d.ok) return { configured: false, verified: false, instructions: [], error: d.json.error?.message ?? `Vercel error ${d.status}` };
    const verification = (d.json.verification as { type: string; domain: string; value: string }[] | undefined) ?? [];
    const apex = domain.split(".").length === 2 || /\.(co|org|net|gov|ac)\.in$/.test(domain) && domain.split(".").length === 3;
    const instructions = [
      apex ? { type: "A", name: "@", value: "76.76.21.21" } : { type: "CNAME", name: domain.split(".")[0], value: "cname.vercel-dns.com" },
      ...verification.map((v) => ({ type: v.type, name: v.domain, value: v.value })),
    ];
    return { configured: cfg.ok && cfg.json.misconfigured === false, verified: d.json.verified === true, instructions };
  }
}
