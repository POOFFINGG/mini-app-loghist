/**
 * Admin API — uses X-Admin-Key header, separate from user JWT.
 */

const BASE = "/api/v1";
const STORAGE_KEY = "admin_key";

export function getAdminKey(): string | null {
  return sessionStorage.getItem(STORAGE_KEY);
}

export function setAdminKey(key: string): void {
  sessionStorage.setItem(STORAGE_KEY, key);
}

export function clearAdminKey(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

async function adminFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const key = getAdminKey();
  const res = await fetch(BASE + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {}),
      ...(key ? { "X-Admin-Key": key } : {}),
    },
  });
  return res;
}

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    let detail: string = text;
    try {
      const json = JSON.parse(text);
      detail = json.detail ?? json.message ?? text;
    } catch {}
    throw new Error(detail || res.statusText);
  }
  return res.json() as Promise<T>;
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface OverviewData {
  users: { total: number };
  requests: {
    total: number;
    today: number;
    week: number;
    month: number;
    archived: number;
    by_status: Record<string, number>;
  };
}

export interface AiUsageData {
  period: string;
  summary: {
    total_requests: number;
    successful: number;
    failed: number;
    total_tokens: number;
    total_cost_usd: number;
    avg_latency_ms: number;
  };
  by_action: Record<string, { count: number; tokens: number; cost: number }>;
  top_users: Array<{ user_id: string; count: number; tokens: number; cost: number }>;
  daily: Array<{ date: string; requests: number; tokens: number; cost: number }>;
}

export interface AuditLog {
  _id: string;
  user_id?: string;
  action: string;
  details?: Record<string, unknown>;
  ip?: string;
  created_at: string;
}

export interface AuditLogsData {
  logs: AuditLog[];
  count: number;
}

export interface TopRoute {
  from: string;
  to: string;
  count: number;
}

// ── API calls ──────────────────────────────────────────────────────────────────

export async function adminGetOverview(): Promise<OverviewData> {
  const res = await adminFetch("/analytics/overview");
  return parseJson<OverviewData>(res);
}

export async function adminGetAiUsage(period: "today" | "week" | "month"): Promise<AiUsageData> {
  const res = await adminFetch(`/analytics/ai-usage?period=${period}`);
  return parseJson<AiUsageData>(res);
}

export async function adminGetAuditLogs(params?: {
  user_id?: string;
  action?: string;
  since?: string;
  skip?: number;
  limit?: number;
}): Promise<AuditLogsData> {
  const q = new URLSearchParams();
  if (params?.user_id) q.set("user_id", params.user_id);
  if (params?.action) q.set("action", params.action);
  if (params?.since) q.set("since", params.since);
  if (params?.skip !== undefined) q.set("skip", String(params.skip));
  if (params?.limit !== undefined) q.set("limit", String(params.limit));
  const res = await adminFetch(`/analytics/audit-logs?${q}`);
  return parseJson<AuditLogsData>(res);
}

export async function adminGetTopRoutes(limit = 10): Promise<TopRoute[]> {
  const res = await adminFetch(`/analytics/top-routes?limit=${limit}`);
  return parseJson<TopRoute[]>(res);
}

export async function adminVerifyKey(key: string): Promise<boolean> {
  const res = await fetch(`${BASE}/analytics/overview`, {
    headers: { "X-Admin-Key": key },
  });
  return res.ok;
}
