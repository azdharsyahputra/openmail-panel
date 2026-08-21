// MailOpen REST API Client & Contract Interfaces

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  display_name: string;
  roles: string[];
  groups: string[];
  provider: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: UserProfile;
}

export interface DomainItem {
  id: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DNSRecord {
  type: string;
  name: string;
  value: string;
  status: string;
}

export interface DomainDNSResponse {
  domain: string;
  records: DNSRecord[];
  valid: boolean;
}

export interface DKIMKeyItem {
  id: string;
  domain: string;
  selector: string;
  status: string;
  dns_record: string;
  created_at: string;
}

export interface MailboxItem {
  id: string;
  domain_id: string;
  domain_name?: string;
  email: string;
  quota_bytes: number;
  used_bytes: number;
  status: string;
  provisioning_status: string;
  identity_provider: string;
  created_at: string;
  updated_at: string;
}

export interface AliasItem {
  id: string;
  domain_id: string;
  mailbox_id: string;
  source: string;
  destination: string;
  alias?: string; // helper
  created_at: string;
}

export interface QueueSummary {
  active: number;
  deferred: number;
  hold: number;
  corrupt: number;
  total: number;
}

export interface QueueMessage {
  id: string;
  sender: string;
  recipient: string;
  size_bytes: number;
  arrival_time: string;
  status: string;
  error_message?: string;
}

export interface AuditLogItem {
  id: string;
  actor: string;
  action: string;
  resource: string;
  ip_address: string;
  status: string;
  details?: Record<string, unknown>;
  created_at: string;
}

export interface SyncReport {
  total_identities: number;
  created: number;
  updated: number;
  suspended: number;
  skipped: number;
  errors?: string[];
  duration: number;
}

export interface HealthReport {
  status: string;
  details?: Record<string, unknown>;
}

export interface DoctorCategory {
  name?: string;
  status?: string;
  passed?: boolean;
  checks: Record<string, string>;
}

export interface SystemDoctorReport {
  healthy: boolean;
  categories: Record<string, DoctorCategory>;
}

const API_BASE = "";

class ApiClient {
  private token: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("openmail_token");
      this.refreshToken = localStorage.getItem("openmail_refresh");
    }
  }

  public setTokens(access: string, refresh: string) {
    this.token = access;
    this.refreshToken = refresh;
    if (typeof window !== "undefined") {
      localStorage.setItem("openmail_token", access);
      localStorage.setItem("openmail_refresh", refresh);
    }
  }

  public clearTokens() {
    this.token = null;
    this.refreshToken = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("openmail_token");
      localStorage.removeItem("openmail_refresh");
    }
  }

  public getToken() {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    if (this.token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${this.token}`);
    }
    if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && this.refreshToken && endpoint !== "/api/v1/auth/refresh") {
      // Attempt token refresh
      try {
        const refreshResp = await this.request<AuthResponse>("/api/v1/auth/refresh", {
          method: "POST",
          body: JSON.stringify({ refresh_token: this.refreshToken }),
        });
        this.setTokens(refreshResp.access_token, refreshResp.refresh_token);
        headers.set("Authorization", `Bearer ${refreshResp.access_token}`);
        const retryResp = await fetch(`${API_BASE}${endpoint}`, {
          ...options,
          headers,
        });
        if (!retryResp.ok) {
          throw new Error(await retryResp.text());
        }
        return retryResp.json();
      } catch (err) {
        this.clearTokens();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        throw err;
      }
    }

    if (!response.ok) {
      let errMsg = response.statusText;
      try {
        const errJson = await response.json();
        errMsg = errJson.message || errJson.error || JSON.stringify(errJson);
      } catch {
        const text = await response.text();
        if (text) errMsg = text;
      }
      throw new Error(errMsg);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Auth
  public async login(credentials: { username: string; password: string }): Promise<AuthResponse> {
    const resp = await this.request<AuthResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    this.setTokens(resp.access_token, resp.refresh_token);
    return resp;
  }

  public async getMe(): Promise<UserProfile> {
    return this.request<UserProfile>("/api/v1/auth/me");
  }

  public async logout(): Promise<void> {
    try {
      await this.request("/api/v1/auth/logout", { method: "POST" });
    } finally {
      this.clearTokens();
    }
  }

  // Health
  public async getLiveHealth(): Promise<HealthReport> {
    return this.request<HealthReport>("/health/live");
  }

  public async getReadyHealth(): Promise<HealthReport> {
    return this.request<HealthReport>("/health/ready");
  }

  public async getDeepHealth(): Promise<HealthReport> {
    return this.request<HealthReport>("/health/deep");
  }

  public async getSystemDoctor(): Promise<SystemDoctorReport> {
    return this.request<SystemDoctorReport>("/api/v1/system/doctor");
  }

  // Domains
  public async getDomains(): Promise<DomainItem[]> {
    const res = await this.request<{ data?: DomainItem[]; domains?: DomainItem[] } | DomainItem[]>("/api/v1/domains");
    if (Array.isArray(res)) return res;
    return res.data || res.domains || [];
  }

  public async createDomain(name: string): Promise<DomainItem> {
    return this.request<DomainItem>("/api/v1/domains", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  }

  public async deleteDomain(name: string): Promise<void> {
    return this.request<void>(`/api/v1/domains/${encodeURIComponent(name)}`, {
      method: "DELETE",
    });
  }

  public async getDomainDNS(name: string): Promise<DomainDNSResponse> {
    return this.request<DomainDNSResponse>(`/api/v1/domains/${encodeURIComponent(name)}/dns`);
  }

  public async getDomainDoctor(name: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(`/api/v1/domains/${encodeURIComponent(name)}/doctor`);
  }

  public async getDomainDKIM(name: string): Promise<DKIMKeyItem[]> {
    const res = await this.request<{ data?: DKIMKeyItem[]; keys?: DKIMKeyItem[] } | DKIMKeyItem[]>(
      `/api/v1/domains/${encodeURIComponent(name)}/dkim`
    );
    if (Array.isArray(res)) return res;
    return res.data || res.keys || [];
  }

  public async generateDomainDKIM(name: string, selector: string): Promise<DKIMKeyItem> {
    return this.request<DKIMKeyItem>(`/api/v1/domains/${encodeURIComponent(name)}/dkim`, {
      method: "POST",
      body: JSON.stringify({ selector }),
    });
  }

  public async verifyDomainDKIM(name: string, selector: string): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>(
      `/api/v1/domains/${encodeURIComponent(name)}/dkim/${encodeURIComponent(selector)}/verify`,
      {
        method: "POST",
      }
    );
  }

  public async activateDomainDKIM(name: string, selector: string): Promise<void> {
    return this.request<void>(
      `/api/v1/domains/${encodeURIComponent(name)}/dkim/${encodeURIComponent(selector)}/activate`,
      {
        method: "POST",
      }
    );
  }

  // Mailboxes
  public async getMailboxes(): Promise<MailboxItem[]> {
    const res = await this.request<{ data?: MailboxItem[]; mailboxes?: MailboxItem[] } | MailboxItem[]>("/api/v1/mailboxes");
    if (Array.isArray(res)) return res;
    return res.data || res.mailboxes || [];
  }

  public async createMailbox(email: string, password: string, quotaBytes: number): Promise<MailboxItem> {
    return this.request<MailboxItem>("/api/v1/mailboxes", {
      method: "POST",
      body: JSON.stringify({ email, password, quota_bytes: quotaBytes }),
    });
  }

  public async deleteMailbox(email: string): Promise<void> {
    return this.request<void>(`/api/v1/mailboxes/${encodeURIComponent(email)}`, {
      method: "DELETE",
    });
  }

  public async suspendMailbox(email: string): Promise<void> {
    return this.request<void>(`/api/v1/mailboxes/${encodeURIComponent(email)}/suspend`, {
      method: "POST",
    });
  }

  public async resumeMailbox(email: string): Promise<void> {
    return this.request<void>(`/api/v1/mailboxes/${encodeURIComponent(email)}/resume`, {
      method: "POST",
    });
  }

  public async provisionMailbox(email: string): Promise<void> {
    return this.request<void>(`/api/v1/mailboxes/${encodeURIComponent(email)}/provision`, {
      method: "POST",
    });
  }

  public async setMailboxPassword(email: string, newPassword: string): Promise<void> {
    return this.request<void>(`/api/v1/mailboxes/${encodeURIComponent(email)}/password`, {
      method: "POST",
      body: JSON.stringify({ password: newPassword }),
    });
  }

  public async getAliases(email: string): Promise<AliasItem[]> {
    const res = await this.request<{ data?: AliasItem[]; aliases?: AliasItem[] } | AliasItem[]>(
      `/api/v1/mailboxes/${encodeURIComponent(email)}/aliases`
    );
    const list = Array.isArray(res) ? res : res.data || res.aliases || [];
    return list.map((a) => ({
      ...a,
      alias: a.source || a.alias || "",
    }));
  }

  public async createAlias(email: string, sourceAlias: string): Promise<AliasItem> {
    return this.request<AliasItem>(`/api/v1/mailboxes/${encodeURIComponent(email)}/aliases`, {
      method: "POST",
      body: JSON.stringify({ source: sourceAlias }),
    });
  }

  public async deleteAlias(email: string, sourceAlias: string): Promise<void> {
    return this.request<void>(
      `/api/v1/mailboxes/${encodeURIComponent(email)}/aliases/${encodeURIComponent(sourceAlias)}`,
      {
        method: "DELETE",
      }
    );
  }

  // Queue
  public async getQueueSummary(): Promise<QueueSummary> {
    return this.request<QueueSummary>("/api/v1/queue?summary=true");
  }

  public async getQueueMessages(status?: string): Promise<QueueMessage[]> {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    const res = await this.request<{ data?: QueueMessage[]; messages?: QueueMessage[] } | QueueMessage[]>(
      `/api/v1/queue${query}`
    );
    if (Array.isArray(res)) return res;
    return res.data || res.messages || [];
  }

  public async inspectQueueMessage(id: string): Promise<{ content: string }> {
    return this.request<{ content: string }>(`/api/v1/queue/${encodeURIComponent(id)}`);
  }

  public async retryQueueMessage(id: string): Promise<void> {
    return this.request<void>(`/api/v1/queue/${encodeURIComponent(id)}/retry`, {
      method: "POST",
    });
  }

  public async holdQueueMessage(id: string): Promise<void> {
    return this.request<void>(`/api/v1/queue/${encodeURIComponent(id)}/hold`, {
      method: "POST",
    });
  }

  public async releaseQueueMessage(id: string): Promise<void> {
    return this.request<void>(`/api/v1/queue/${encodeURIComponent(id)}/release`, {
      method: "POST",
    });
  }

  public async deleteQueueMessage(id: string): Promise<void> {
    return this.request<void>(`/api/v1/queue/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  public async flushQueue(): Promise<void> {
    return this.request<void>("/api/v1/queue/flush", {
      method: "POST",
    });
  }

  // LDAP & Identity
  public async getLDAPStatus(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>("/api/v1/ldap/status");
  }

  public async syncLDAP(options: { domain_name?: string; auto_create_mailbox?: boolean; dry_run?: boolean }): Promise<SyncReport> {
    return this.request<SyncReport>("/api/v1/ldap/sync", {
      method: "POST",
      body: JSON.stringify(options),
    });
  }

  // Audit
  public async getAuditLogs(): Promise<AuditLogItem[]> {
    const res = await this.request<{ data?: AuditLogItem[]; audit_logs?: AuditLogItem[] } | AuditLogItem[]>("/api/v1/audit");
    if (Array.isArray(res)) return res;
    return res.data || res.audit_logs || [];
  }
}

export const api = new ApiClient();
