import { createHash } from "node:crypto";
import { HttpError } from "./db";

export type Session = { access_token: string; refresh_token: string; expires_in: number; email: string };

/**
 * Admin login with Supabase Auth (email + password). Only addresses in ADMIN_EMAILS may use the admin panel.
 * Users are created in Supabase → Authentication → Users ("Add user"), with "Auto confirm".
 */
export class Auth {
  private cache = new Map<string, { email: string; until: number }>();

  constructor(
    private supabaseUrl: string,
    private anonKey: string,
    private allowed: Set<string>,
  ) {}

  private async gotrue<T>(path: string, init: RequestInit): Promise<T> {
    const res = await fetch(`${this.supabaseUrl.replace(/\/$/, "")}/auth/v1/${path}`, {
      ...init,
      headers: { apikey: this.anonKey, "Content-Type": "application/json", ...(init.headers ?? {}) },
    });
    const body = (await res.json().catch(() => ({}))) as T & { error_description?: string; msg?: string };
    if (!res.ok) throw new HttpError(res.status === 400 || res.status === 401 ? 401 : 502, body.error_description ?? body.msg ?? "Login failed");
    return body;
  }

  private checkAllowed(email: string | undefined): string {
    const e = (email ?? "").toLowerCase();
    if (!this.allowed.has(e)) throw new HttpError(403, "This account is not an admin");
    return e;
  }

  async login(email: string, password: string): Promise<Session> {
    if (!email || !password) throw new HttpError(400, "Email and password are required");
    this.checkAllowed(email); // refuse early, before asking Supabase
    const s = await this.gotrue<{ access_token: string; refresh_token: string; expires_in: number; user: { email: string } }>(
      "token?grant_type=password",
      { method: "POST", body: JSON.stringify({ email, password }) },
    );
    return { access_token: s.access_token, refresh_token: s.refresh_token, expires_in: s.expires_in, email: this.checkAllowed(s.user?.email) };
  }

  async refresh(refreshToken: string): Promise<Session> {
    if (!refreshToken) throw new HttpError(401, "Missing refresh token");
    const s = await this.gotrue<{ access_token: string; refresh_token: string; expires_in: number; user: { email: string } }>(
      "token?grant_type=refresh_token",
      { method: "POST", body: JSON.stringify({ refresh_token: refreshToken }) },
    );
    return { access_token: s.access_token, refresh_token: s.refresh_token, expires_in: s.expires_in, email: this.checkAllowed(s.user?.email) };
  }

  /** Email of the admin behind a bearer token (checked with Supabase, cached for a minute). */
  async verify(authorization: string | undefined): Promise<string> {
    const token = authorization?.replace(/^Bearer /, "") ?? "";
    if (!token) throw new HttpError(401, "Please log in");
    const key = createHash("sha256").update(token).digest("hex");
    const hit = this.cache.get(key);
    if (hit && hit.until > Date.now()) return hit.email;
    const user = await this.gotrue<{ email: string }>("user", { method: "GET", headers: { Authorization: `Bearer ${token}` } });
    const email = this.checkAllowed(user.email);
    this.cache.set(key, { email, until: Date.now() + 60_000 });
    if (this.cache.size > 1000) this.cache.delete(this.cache.keys().next().value!);
    return email;
  }
}
