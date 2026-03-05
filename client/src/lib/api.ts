/**
 * Central API service — handles JWT tokens, automatic refresh, and all backend calls.
 * All requests go through /api/v1 (proxied to http://localhost:8000 in dev).
 */

const BASE = "/api/v1";

// ── Token helpers ──────────────────────────────────────────────────────────────

export function getToken(): string | null {
  return localStorage.getItem("access_token");
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
}

export function clearTokens(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

// ── Core fetch wrapper ─────────────────────────────────────────────────────────

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    setTokens(data.access_token, data.refresh_token);
    return data.access_token;
  } catch {
    return null;
  }
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (
    options.body &&
    typeof options.body === "string" &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(BASE + path, { ...options, headers });

  if (res.status === 401 && !isRetry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiFetch(path, options, true);
    } else {
      clearTokens();
      window.location.href = "/auth";
      throw new Error("Unauthorized");
    }
  }

  return res;
}

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    let detail: string = text;
    try {
      const json = JSON.parse(text);
      const raw = json.detail ?? json.message ?? text;
      if (Array.isArray(raw)) {
        detail = raw.map((e: any) => e.msg ?? JSON.stringify(e)).join("; ");
      } else {
        detail = String(raw);
      }
    } catch {}
    throw new Error(detail || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Auth ───────────────────────────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserPublic {
  id: string;
  email: string;
  phone?: string;
  personal?: { full_name?: string; position?: string };
  company?: {
    name?: string;
    legal_address?: string;
    inn?: string;
    kpp?: string;
    ogrn?: string;
    contact_phone?: string;
    contact_email?: string;
  };
  bank?: {
    bank_name?: string;
    bik?: string;
    account_number?: string;
    correspondent_account?: string;
  };
  logistician?: { phone?: string; email?: string };
  is_active: boolean;
  subscription_plan: string;
  subscription_expires?: string;
  created_at: string;
}

export async function login(emailOrPhone: string, password: string): Promise<TokenResponse> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login: emailOrPhone, password }),
  });
  return parseJson<TokenResponse>(res);
}

export async function register(data: {
  email: string;
  phone?: string;
  password: string;
  pd_consent: boolean;
  personal: { full_name: string; position: string };
  company: {
    name: string;
    legal_address: string;
    inn: string;
    kpp?: string;
    ogrn: string;
    contact_phone: string;
    contact_email?: string;
  };
  bank?: {
    bank_name: string;
    bik: string;
    account_number: string;
    correspondent_account: string;
  };
  logistician: { phone: string; email: string };
}): Promise<TokenResponse> {
  const res = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return parseJson<TokenResponse>(res);
}

export async function logout(): Promise<void> {
  await apiFetch("/auth/logout", { method: "POST" });
  clearTokens();
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  const res = await apiFetch("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ current_password: oldPassword, new_password: newPassword }),
  });
  return parseJson<void>(res);
}

// ── Profile ────────────────────────────────────────────────────────────────────

export async function getProfile(): Promise<UserPublic> {
  const res = await apiFetch("/profile/me");
  return normalizeDoc<UserPublic>(await parseJson<any>(res));
}

export async function updateSubscription(plan: "free" | "pro" | "enterprise"): Promise<UserPublic> {
  const res = await apiFetch("/profile/subscription", {
    method: "PATCH",
    body: JSON.stringify({ plan }),
  });
  return parseJson<UserPublic>(res);
}

export async function updateProfile(data: Partial<{
  personal: { full_name?: string; position?: string };
  company: { name?: string; legal_address?: string; inn?: string; kpp?: string; ogrn?: string; contact_phone?: string; contact_email?: string };
  bank: { bank_name?: string; bik?: string; account_number?: string; correspondent_account?: string };
  logistician: { phone?: string; email?: string };
}>): Promise<UserPublic> {
  const res = await apiFetch("/profile/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return parseJson<UserPublic>(res);
}

// ── Requests ───────────────────────────────────────────────────────────────────

export interface LogisticsRequest {
  id: string;
  request_number: string;
  status: string;
  transport_type?: string;
  created_at: string;
  comments?: string;
  is_archived?: boolean;
  origin?: { address?: string; contact_name?: string; contact_phone?: string; date?: string; time?: string };
  destination?: { address?: string; contact_name?: string; contact_phone?: string; date?: string; time?: string };
  waypoints?: Array<{ address?: string; date?: string; time?: string }>;
  cargo?: { name?: string; weight_kg?: number; volume_m3?: number; quantity?: number; package_type?: string; temperature_regime?: string; hazard_class?: string };
  transport?: { type?: string; brand?: string; truck_plate?: string; trailer_plate?: string };
  driver?: { full_name?: string; phone?: string; license_number?: string };
  payment?: { rate?: number; vat_included?: boolean; payment_terms?: string; currency?: string };
  counterparty?: { name?: string; inn?: string; counterparty_id?: string };
}

function normalizeRequest(r: any): LogisticsRequest {
  return { ...r, id: r.id ?? r._id ?? "" };
}

export async function listRequests(params?: {
  status?: string;
  archived?: boolean;
  skip?: number;
  limit?: number;
}): Promise<LogisticsRequest[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.archived !== undefined) query.set("archived", String(params.archived));
  if (params?.skip !== undefined) query.set("skip", String(params.skip));
  if (params?.limit !== undefined) query.set("limit", String(params.limit));
  const res = await apiFetch(`/requests/?${query}`);
  const list = await parseJson<any[]>(res);
  return list.map(normalizeRequest);
}

export async function getRequest(id: string): Promise<LogisticsRequest> {
  const res = await apiFetch(`/requests/${id}`);
  return normalizeRequest(await parseJson<any>(res));
}

export async function createRequest(data: Partial<LogisticsRequest>): Promise<LogisticsRequest> {
  const res = await apiFetch("/requests/", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return normalizeRequest(await parseJson<any>(res));
}

export async function updateRequest(id: string, data: Partial<LogisticsRequest>): Promise<LogisticsRequest> {
  const res = await apiFetch(`/requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return normalizeRequest(await parseJson<any>(res));
}

export async function deleteRequest(id: string): Promise<void> {
  const res = await apiFetch(`/requests/${id}`, { method: "DELETE" });
  return parseJson<void>(res);
}

// AI endpoints
export async function aiParseText(text: string): Promise<Record<string, unknown>> {
  const res = await apiFetch("/requests/ai/parse-text", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
  const data = await parseJson<{ parsed: Record<string, unknown> }>(res);
  return data.parsed;
}

export async function aiParseImage(file: File): Promise<Record<string, unknown>> {
  const form = new FormData();
  form.append("file", file);
  const res = await apiFetch("/requests/ai/parse-image", {
    method: "POST",
    body: form,
  });
  const data = await parseJson<{ parsed: Record<string, unknown> }>(res);
  return data.parsed;
}

export async function aiChat(messages: { role: string; content: string }[]): Promise<string> {
  const res = await apiFetch("/requests/ai/chat", {
    method: "POST",
    body: JSON.stringify({ messages }),
  });
  const data = await parseJson<{ reply: string }>(res);
  return data.reply;
}

// ── Notifications ──────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  request_id?: string;
}

export async function listNotifications(unreadOnly = false): Promise<Notification[]> {
  const res = await apiFetch(`/notifications/?unread_only=${unreadOnly}`);
  return parseJson<Notification[]>(res);
}

export async function getUnreadCount(): Promise<number> {
  const res = await apiFetch("/notifications/unread-count");
  const data = await parseJson<{ count: number }>(res);
  return data.count;
}

export async function markNotificationRead(id: string): Promise<void> {
  const res = await apiFetch(`/notifications/${id}/read`, { method: "POST" });
  return parseJson<void>(res);
}

export async function markAllNotificationsRead(): Promise<void> {
  const res = await apiFetch("/notifications/read-all", { method: "POST" });
  return parseJson<void>(res);
}

// ── Database ───────────────────────────────────────────────────────────────────

export interface Counterparty {
  id: string;
  name: string;
  type?: string;
  inn: string;
  kpp?: string;
  ogrn?: string;
  legal_address?: string;
  contact_phone?: string;
  contact_email?: string;
}

function normalizeDoc<T extends { id?: string; _id?: string }>(d: any): T {
  return { ...d, id: d.id ?? d._id ?? "" } as T;
}
function normalizeDocs<T extends { id?: string; _id?: string }>(list: any[]): T[] {
  return list.map(normalizeDoc<T>);
}

export async function listCounterparties(search?: string, skip = 0, limit = 50): Promise<Counterparty[]> {
  const q = new URLSearchParams({ skip: String(skip), limit: String(limit) });
  if (search) q.set("search", search);
  const res = await apiFetch(`/db/counterparties?${q}`);
  return normalizeDocs<Counterparty>(await parseJson<any[]>(res));
}

export async function createCounterparty(data: Omit<Counterparty, "id">): Promise<Counterparty> {
  const res = await apiFetch("/db/counterparties", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return normalizeDoc<Counterparty>(await parseJson<any>(res));
}

export async function updateCounterparty(id: string, data: Partial<Counterparty>): Promise<Counterparty> {
  const res = await apiFetch(`/db/counterparties/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return parseJson<Counterparty>(res);
}

export async function deleteCounterparty(id: string): Promise<void> {
  const res = await apiFetch(`/db/counterparties/${id}`, { method: "DELETE" });
  return parseJson<void>(res);
}

export interface Driver {
  id: string;
  full_name: string;
  phone?: string;
  license_number?: string;
  passport_series?: string;
  passport_number?: string;
}

export async function listDrivers(search?: string, skip = 0, limit = 50): Promise<Driver[]> {
  const q = new URLSearchParams({ skip: String(skip), limit: String(limit) });
  if (search) q.set("search", search);
  const res = await apiFetch(`/db/drivers?${q}`);
  return normalizeDocs<Driver>(await parseJson<any[]>(res));
}

export async function createDriver(data: Omit<Driver, "id">): Promise<Driver> {
  const res = await apiFetch("/db/drivers", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return normalizeDoc<Driver>(await parseJson<any>(res));
}

export async function updateDriver(id: string, data: Partial<Driver>): Promise<Driver> {
  const res = await apiFetch(`/db/drivers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return parseJson<Driver>(res);
}

export async function deleteDriver(id: string): Promise<void> {
  const res = await apiFetch(`/db/drivers/${id}`, { method: "DELETE" });
  return parseJson<void>(res);
}

export interface Vehicle {
  id: string;
  brand?: string;
  truck_plate: string;
  trailer_plate?: string;
  type?: string;
  carrying_capacity?: number;
}

export async function listVehicles(skip = 0, limit = 50): Promise<Vehicle[]> {
  const q = new URLSearchParams({ skip: String(skip), limit: String(limit) });
  const res = await apiFetch(`/db/vehicles?${q}`);
  return normalizeDocs<Vehicle>(await parseJson<any[]>(res));
}

export async function createVehicle(data: Omit<Vehicle, "id">): Promise<Vehicle> {
  const res = await apiFetch("/db/vehicles", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return normalizeDoc<Vehicle>(await parseJson<any>(res));
}

export async function updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
  const res = await apiFetch(`/db/vehicles/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return parseJson<Vehicle>(res);
}

export async function deleteVehicle(id: string): Promise<void> {
  const res = await apiFetch(`/db/vehicles/${id}`, { method: "DELETE" });
  return parseJson<void>(res);
}

export interface Document {
  id: string;
  filename: string;
  content_type: string;
  size: number;
  created_at: string;
  request_id?: string;
  ocr_text?: string;
}

export async function listDocuments(requestId?: string, skip = 0, limit = 50): Promise<Document[]> {
  const q = new URLSearchParams({ skip: String(skip), limit: String(limit) });
  if (requestId) q.set("request_id", requestId);
  const res = await apiFetch(`/db/documents?${q}`);
  return normalizeDocs<Document>(await parseJson<any[]>(res));
}

export async function uploadDocument(file: File, requestId?: string, runOcr = false): Promise<Document> {
  const form = new FormData();
  form.append("file", file);
  if (requestId) form.append("request_id", requestId);
  form.append("run_ocr", String(runOcr));
  const res = await apiFetch("/db/documents/upload", {
    method: "POST",
    body: form,
  });
  return normalizeDoc<Document>(await parseJson<any>(res));
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await apiFetch(`/db/documents/${id}`, { method: "DELETE" });
  return parseJson<void>(res);
}

export function getDocumentDownloadUrl(id: string): string {
  return `${BASE}/db/documents/${id}/download?token=${getToken()}`;
}

// ── Request history ────────────────────────────────────────────────────────────

export interface RequestHistoryEntry {
  _id: string;
  action: string;
  user_id?: string;
  ip_address?: string;
  details?: Record<string, any>;
  success: boolean;
  created_at: string;
}

export async function getRequestHistory(id: string): Promise<RequestHistoryEntry[]> {
  const res = await apiFetch(`/requests/${id}/history`);
  return parseJson<RequestHistoryEntry[]>(res);
}

// ── Support chat ───────────────────────────────────────────────────────────────

export interface SupportMessage {
  id: string;
  user_id: string;
  role: "user" | "operator";
  text: string;
  created_at: string;
  read: boolean;
}

export async function getSupportMessages(): Promise<SupportMessage[]> {
  const res = await apiFetch("/support/messages");
  return parseJson<SupportMessage[]>(res);
}

export async function sendSupportMessage(text: string): Promise<SupportMessage> {
  const res = await apiFetch("/support/messages", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
  return parseJson<SupportMessage>(res);
}

export async function markSupportRead(): Promise<void> {
  const res = await apiFetch("/support/messages/read", { method: "POST" });
  return parseJson<void>(res);
}

export interface SupportConversation {
  user_id: string;
  last_message: string;
  last_role: "user" | "operator";
  last_at: string;
  unread: number;
  user_name?: string;
  user_company?: string;
}

function adminHeaders(): Record<string, string> {
  const key = sessionStorage.getItem("admin_key") || "";
  return { "X-Admin-Key": key };
}

export async function adminListConversations(): Promise<SupportConversation[]> {
  const res = await fetch(`${BASE}/support/admin/conversations`, { headers: adminHeaders() });
  return parseJson<SupportConversation[]>(res);
}

export async function adminGetConversation(userId: string): Promise<SupportMessage[]> {
  const res = await fetch(`${BASE}/support/admin/conversations/${userId}`, { headers: adminHeaders() });
  return parseJson<SupportMessage[]>(res);
}

export async function adminSendMessage(userId: string, text: string): Promise<SupportMessage> {
  const res = await fetch(`${BASE}/support/admin/conversations/${userId}`, {
    method: "POST",
    headers: { ...adminHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return parseJson<SupportMessage>(res);
}

// ── Analytics (admin) ──────────────────────────────────────────────────────────

export interface AiUsageLog {
  date: string;
  calls: number;
  tokens: number;
  cost: number;
}

export interface AnalyticsOverview {
  total_users: number;
  total_requests: number;
  active_requests: number;
  total_documents: number;
  ai_calls_month: number;
  ai_cost_month: number;
}

const ADMIN_KEY = localStorage.getItem("admin_key") || "";

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const res = await apiFetch("/analytics/overview");
  return parseJson<AnalyticsOverview>(res);
}

export async function getAiUsage(period = "week"): Promise<AiUsageLog[]> {
  const res = await apiFetch(`/analytics/ai-usage?period=${period}`);
  return parseJson<AiUsageLog[]>(res);
}

export interface UserAnalytics {
  total: number;
  growth: number;
  revenue: number;
  paid_revenue: number;
  rev_growth: number;
  monthly: Array<{ name: string; requests: number; revenue: number }>;
  status_data: Array<{ name: string; value: number; color: string }>;
  top_routes: Array<{ name: string; count: number; pct: number }>;
}

export async function getUserAnalytics(): Promise<UserAnalytics> {
  const res = await apiFetch("/analytics/user");
  return parseJson<UserAnalytics>(res);
}
