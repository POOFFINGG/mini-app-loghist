import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Users, FileText, Brain, Route, Shield, LogOut, TrendingUp,
  Clock, CheckCircle, XCircle, Zap, DollarSign, Activity,
  Search, ChevronLeft, ChevronRight, RefreshCw, MapPin,
  MessageCircle, Send, Headphones,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import {
  getAdminKey, clearAdminKey,
  adminGetOverview, adminGetAiUsage, adminGetAuditLogs, adminGetTopRoutes,
  type OverviewData, type AiUsageData, type AuditLogsData, type TopRoute,
} from "@/lib/admin-api";
import {
  adminListConversations, adminGetConversation, adminSendMessage,
  type SupportConversation, type SupportMessage,
} from "@/lib/api";

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  try { return format(parseISO(d), "dd.MM.yy HH:mm", { locale: ru }); } catch { return d; }
}
function fmtDay(d: string) {
  try { return format(parseISO(d), "dd MMM", { locale: ru }); } catch { return d; }
}
function usdToRub(usd: number) { return (usd * 90).toFixed(2); }

const STATUS_COLORS: Record<string, string> = {
  "Требуется подтверждение": "#94a3b8",
  "Подтверждена": "#22c55e",
  "В пути": "#00b3f2",
  "Требуется прикрепить документ": "#f97316",
  "Ожидает оплаты": "#ef4444",
  "Оплачена": "#10b981",
  "В архив": "#64748b",
};

const PIE_COLORS = ["#00b3f2", "#22c55e", "#f97316", "#ef4444", "#8b5cf6", "#10b981", "#64748b"];

// ── Stat Card ──────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color = "#00b3f2" }: {
  icon: any; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="bg-[#131929] border border-white/8 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: color + "22" }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <p className="text-[11px] text-slate-500 font-medium leading-tight">{label}</p>
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        {sub && <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{sub}</p>}
      </div>
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-bold text-white mb-4">{children}</h2>;
}

// ── Tabs ───────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview", label: "Обзор", icon: Activity },
  { id: "ai", label: "ИИ аналитика", icon: Brain },
  { id: "audit", label: "Аудит", icon: Shield },
  { id: "routes", label: "Маршруты", icon: Route },
  { id: "support", label: "Поддержка", icon: MessageCircle },
];

// ── Overview Tab ───────────────────────────────────────────────────────────────

function OverviewTab() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetOverview().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (!data) return <ErrorMsg text="Не удалось загрузить данные" />;

  const byStatusArr = Object.entries(data.requests.by_status).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Users} label="Пользователей" value={data.users.total} color="#00b3f2" />
        <StatCard icon={FileText} label="Заявок всего" value={data.requests.total} color="#8b5cf6" />
        <StatCard icon={TrendingUp} label="За неделю" value={data.requests.week} sub={`Сегодня: ${data.requests.today}`} color="#22c55e" />
        <StatCard icon={Clock} label="В архиве" value={data.requests.archived} color="#64748b" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By status pie */}
        <div className="bg-[#131929] border border-white/8 rounded-2xl p-6">
          <SectionTitle>Заявки по статусам</SectionTitle>
          {byStatusArr.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={byStatusArr} dataKey="value" cx="50%" cy="50%" outerRadius={70} paddingAngle={2}>
                    {byStatusArr.map((entry, i) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.name] ?? PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#1a2235", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }}
                    formatter={(v: number) => [v, "Заявок"]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {byStatusArr.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: STATUS_COLORS[entry.name] ?? PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-xs text-slate-400 truncate">{entry.name}</span>
                    </div>
                    <span className="text-xs font-bold text-white shrink-0">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <Empty text="Нет данных" />}
        </div>

        {/* Period bar */}
        <div className="bg-[#131929] border border-white/8 rounded-2xl p-6">
          <SectionTitle>Динамика заявок</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={[
              { name: "Сегодня", value: data.requests.today },
              { name: "Неделя", value: data.requests.week },
              { name: "Месяц", value: data.requests.month },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "#1a2235", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} />
              <Bar dataKey="value" fill="#00b3f2" radius={[6, 6, 0, 0]} name="Заявок" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── AI Tab ─────────────────────────────────────────────────────────────────────

const PERIOD_LABELS = { today: "Сегодня", week: "Неделя", month: "Месяц" };

function AiTab() {
  const [period, setPeriod] = useState<"today" | "week" | "month">("month");
  const [data, setData] = useState<AiUsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminGetAiUsage(period).then(setData).catch(console.error).finally(() => setLoading(false));
  }, [period]);

  const s = data?.summary;

  const actionData = data
    ? Object.entries(data.by_action).map(([action, v]) => ({
        name: action.replace("_", " "),
        count: v.count,
        tokens: v.tokens,
        cost: parseFloat(usdToRub(v.cost)),
      }))
    : [];

  const dailyData = data?.daily.map((d) => ({
    date: fmtDay(d.date),
    requests: d.requests,
    tokens: d.tokens,
    cost: parseFloat(usdToRub(d.cost)),
  })) ?? [];

  return (
    <div className="space-y-8">
      {/* Period selector */}
      <div className="flex items-center gap-2">
        {(["today", "week", "month"] as const).map((p) => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${period === p ? "bg-cyan-500 text-white" : "bg-[#131929] text-slate-400 hover:text-white border border-white/10"}`}>
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {loading ? <Loader /> : !data ? <ErrorMsg text="Нет данных" /> : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Brain} label="Запросов к ИИ" value={s!.total_requests} sub={`Успешных: ${s!.successful} / Ошибок: ${s!.failed}`} color="#8b5cf6" />
            <StatCard icon={Zap} label="Токенов потрачено" value={s!.total_tokens.toLocaleString("ru")} color="#f59e0b" />
            <StatCard icon={DollarSign} label="Стоимость (₽)" value={usdToRub(s!.total_cost_usd)} sub={`$${s!.total_cost_usd.toFixed(4)} USD`} color="#22c55e" />
            <StatCard icon={Clock} label="Ср. задержка" value={`${Math.round(s!.avg_latency_ms)} мс`} color="#00b3f2" />
            <StatCard icon={CheckCircle} label="Успешных" value={s!.successful} color="#10b981" />
            <StatCard icon={XCircle} label="Ошибок" value={s!.failed} color="#ef4444" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By action */}
            <div className="bg-[#131929] border border-white/8 rounded-2xl p-6">
              <SectionTitle>По типу запроса</SectionTitle>
              {actionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={actionData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" horizontal={false} />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} width={80} />
                    <Tooltip contentStyle={{ background: "#1a2235", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Запросов" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <Empty text="Нет данных об использовании ИИ" />}
            </div>

            {/* Daily */}
            <div className="bg-[#131929] border border-white/8 rounded-2xl p-6">
              <SectionTitle>Запросы по дням</SectionTitle>
              {dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" vertical={false} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: "#1a2235", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} />
                    <Line type="monotone" dataKey="requests" stroke="#00b3f2" strokeWidth={2.5} dot={false} name="Запросов" />
                  </LineChart>
                </ResponsiveContainer>
              ) : <Empty text="Нет данных за выбранный период" />}
            </div>
          </div>

          {/* Top users */}
          {data.top_users.length > 0 && (
            <div className="bg-[#131929] border border-white/8 rounded-2xl p-6">
              <SectionTitle>Топ пользователей по расходу</SectionTitle>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-white/8">
                      <th className="pb-3 pr-4">#</th>
                      <th className="pb-3 pr-4">User ID</th>
                      <th className="pb-3 pr-4">Запросов</th>
                      <th className="pb-3 pr-4">Токенов</th>
                      <th className="pb-3">Стоимость (₽)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.top_users.map((u, i) => (
                      <tr key={i} className="text-slate-300">
                        <td className="py-3 pr-4 text-slate-600">{i + 1}</td>
                        <td className="py-3 pr-4 font-mono text-xs text-slate-400 truncate max-w-[180px]">{u.user_id}</td>
                        <td className="py-3 pr-4 font-semibold text-white">{u.count}</td>
                        <td className="py-3 pr-4">{u.tokens.toLocaleString("ru")}</td>
                        <td className="py-3 text-green-400 font-semibold">₽{usdToRub(u.cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Cost daily chart */}
          {dailyData.length > 0 && (
            <div className="bg-[#131929] border border-white/8 rounded-2xl p-6">
              <SectionTitle>Расходы по дням (₽)</SectionTitle>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "#1a2235", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} formatter={(v: number) => [`₽${v}`, "Расход"]} />
                  <Bar dataKey="cost" fill="#22c55e" radius={[4, 4, 0, 0]} name="Расход ₽" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Audit Tab ──────────────────────────────────────────────────────────────────

function AuditTab() {
  const [data, setData] = useState<AuditLogsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const load = () => {
    setLoading(true);
    adminGetAuditLogs({
      action: actionFilter || undefined,
      user_id: search || undefined,
      skip: page * PAGE_SIZE,
      limit: PAGE_SIZE,
    }).then(setData).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, actionFilter]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(0); load(); };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-[#131929] border border-white/8 rounded-2xl p-5">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="User ID..."
              className="w-full bg-[#0d1424] border border-white/10 text-white placeholder:text-slate-600 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <input
            type="text" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
            placeholder="Фильтр по действию..."
            className="flex-1 min-w-[180px] bg-[#0d1424] border border-white/10 text-white placeholder:text-slate-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <button type="submit"
            className="bg-cyan-500 hover:bg-cyan-400 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Обновить
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-[#131929] border border-white/8 rounded-2xl overflow-hidden">
        {loading ? <div className="p-12"><Loader /></div> : !data || data.logs.length === 0 ? (
          <div className="p-12"><Empty text="Записей аудита не найдено" /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 uppercase tracking-wider bg-[#0d1424]">
                    <th className="px-5 py-3">Время</th>
                    <th className="px-5 py-3">Действие</th>
                    <th className="px-5 py-3">User ID</th>
                    <th className="px-5 py-3">IP</th>
                    <th className="px-5 py-3">Детали</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.logs.map((log) => (
                    <tr key={log._id} className="text-slate-300 hover:bg-white/3 transition-colors">
                      <td className="px-5 py-3 whitespace-nowrap text-xs text-slate-500">{fmtDate(log.created_at)}</td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-500 max-w-[120px] truncate">{log.user_id ?? "—"}</td>
                      <td className="px-5 py-3 text-xs text-slate-500">{log.ip ?? "—"}</td>
                      <td className="px-5 py-3 text-xs text-slate-600 max-w-[200px] truncate">
                        {log.details ? JSON.stringify(log.details) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/8">
              <span className="text-xs text-slate-500">Записей: {data.count}</span>
              <div className="flex gap-2">
                <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                  className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/30 disabled:opacity-30 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-slate-400 flex items-center px-2">стр. {page + 1}</span>
                <button disabled={data.logs.length < PAGE_SIZE} onClick={() => setPage(p => p + 1)}
                  className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/30 disabled:opacity-30 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Routes Tab ─────────────────────────────────────────────────────────────────

function RoutesTab() {
  const [routes, setRoutes] = useState<TopRoute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetTopRoutes(20).then(setRoutes).catch(console.error).finally(() => setLoading(false));
  }, []);

  const max = routes[0]?.count ?? 1;

  return (
    <div className="space-y-6">
      <div className="bg-[#131929] border border-white/8 rounded-2xl p-6">
        <SectionTitle>Популярные маршруты</SectionTitle>
        {loading ? <Loader /> : routes.length === 0 ? <Empty text="Данных о маршрутах пока нет" /> : (
          <div className="space-y-3">
            {routes.map((r, i) => (
              <div key={i} className="group">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-slate-600 w-5 shrink-0">{i + 1}</span>
                    <MapPin className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                    <span className="text-sm text-slate-300 truncate">
                      <span className="font-medium text-white">{r.from.split(",")[0]}</span>
                      <span className="text-slate-500 mx-2">→</span>
                      <span className="font-medium text-white">{r.to.split(",")[0]}</span>
                    </span>
                  </div>
                  <span className="text-sm font-bold text-cyan-400 shrink-0 ml-4">{r.count} раз</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${(r.count / max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bar chart */}
      {!loading && routes.length > 0 && (
        <div className="bg-[#131929] border border-white/8 rounded-2xl p-6">
          <SectionTitle>График частоты маршрутов</SectionTitle>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={routes.slice(0, 10).map(r => ({
              name: r.from.split(",")[0].slice(0, 8) + "→" + r.to.split(",")[0].slice(0, 8),
              count: r.count,
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#1a2235", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }} />
              <Bar dataKey="count" fill="#00b3f2" radius={[4, 4, 0, 0]} name="Заявок" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ── Support Tab ────────────────────────────────────────────────────────────────

function fmtTime(iso: string) {
  try { return format(parseISO(iso), "HH:mm dd.MM", { locale: ru }); } catch { return iso; }
}

function SupportTab() {
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadConversations = () => {
    adminListConversations().then(setConversations).catch(console.error).finally(() => setLoading(false));
  };

  const loadMessages = (userId: string) => {
    adminGetConversation(userId).then((msgs) => {
      setMessages(msgs);
      // refresh unread count
      setConversations(prev => prev.map(c => c.user_id === userId ? { ...c, unread: 0 } : c));
    }).catch(console.error);
  };

  useEffect(() => {
    loadConversations();
    pollRef.current = setInterval(() => {
      loadConversations();
      if (selectedUserId) loadMessages(selectedUserId);
    }, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selectedUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectConversation = (userId: string) => {
    setSelectedUserId(userId);
    loadMessages(userId);
  };

  const handleSend = async () => {
    if (!selectedUserId || !text.trim() || sending) return;
    setSending(true);
    const t = text.trim();
    setText("");
    try {
      await adminSendMessage(selectedUserId, t);
      loadMessages(selectedUserId);
    } catch {
      setText(t);
    } finally {
      setSending(false);
    }
  };

  const showList = !selectedUserId;

  return (
    <div className="flex gap-4 h-[calc(100vh-160px)]">
      {/* Conversation list */}
      <div className={`${showList ? "flex" : "hidden md:flex"} w-full md:w-72 md:shrink-0 bg-[#131929] border border-white/8 rounded-2xl overflow-hidden flex-col`}>
        <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
          <span className="text-sm font-bold text-white">Диалоги</span>
          <button onClick={loadConversations} className="text-slate-500 hover:text-white transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        {loading ? (
          <div className="flex-1 flex items-center justify-center"><Loader /></div>
        ) : conversations.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <Empty text="Обращений пока нет" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {conversations.map(conv => (
              <button
                key={conv.user_id}
                onClick={() => selectConversation(conv.user_id)}
                className={`w-full px-4 py-3 text-left border-b border-white/5 hover:bg-white/5 transition-colors ${selectedUserId === conv.user_id ? "bg-cyan-500/10 border-l-2 border-l-cyan-500" : ""}`}
              >
                <div className="flex items-start justify-between gap-2 mb-0.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                      <Headphones className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <span className="text-sm font-medium text-white truncate">
                      {conv.user_name || "Пользователь"}
                    </span>
                  </div>
                  {conv.unread > 0 && (
                    <span className="shrink-0 bg-cyan-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                      {conv.unread}
                    </span>
                  )}
                </div>
                {conv.user_company && (
                  <p className="text-[11px] text-slate-500 pl-9 truncate">{conv.user_company}</p>
                )}
                <p className="text-xs text-slate-500 pl-9 truncate mt-0.5">
                  <span className={conv.last_role === "user" ? "text-slate-400" : "text-cyan-600"}>
                    {conv.last_role === "operator" ? "Вы: " : ""}
                  </span>
                  {conv.last_message}
                </p>
                <p className="text-[10px] text-slate-600 pl-9 mt-1">{fmtTime(conv.last_at)}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chat area */}
      <div className={`${!showList ? "flex" : "hidden md:flex"} flex-1 bg-[#131929] border border-white/8 rounded-2xl flex-col overflow-hidden`}>
        {!selectedUserId ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-600">
            <MessageCircle className="w-12 h-12 opacity-20" />
            <p className="text-sm">Выберите диалог</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="px-4 py-3 border-b border-white/8 flex items-center gap-3">
              <button
                onClick={() => setSelectedUserId(null)}
                className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors shrink-0"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                <Headphones className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  {conversations.find(c => c.user_id === selectedUserId)?.user_name || "Пользователь"}
                </p>
                {conversations.find(c => c.user_id === selectedUserId)?.user_company && (
                  <p className="text-xs text-slate-500 truncate">
                    {conversations.find(c => c.user_id === selectedUserId)?.user_company}
                  </p>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === "operator" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "operator"
                      ? "bg-cyan-500/20 text-cyan-100 rounded-br-sm"
                      : "bg-[#0d1424] border border-white/8 text-slate-300 rounded-bl-sm"
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <p className={`text-[10px] mt-1 ${msg.role === "operator" ? "text-cyan-500/60 text-right" : "text-slate-600"}`}>
                      {fmtTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-white/8 flex items-end gap-2">
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="Ответ клиенту..."
                rows={1}
                className="flex-1 resize-none bg-[#0d1424] border border-white/10 text-white placeholder:text-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 max-h-28 overflow-y-auto"
                style={{ minHeight: "42px" }}
                onInput={e => {
                  const el = e.currentTarget;
                  el.style.height = "42px";
                  el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
                }}
              />
              <button
                onClick={handleSend}
                disabled={!text.trim() || sending}
                className="w-10 h-10 shrink-0 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 transition-colors flex items-center justify-center"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Utility components ─────────────────────────────────────────────────────────

function Loader() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-center text-slate-600 py-10 text-sm">{text}</p>;
}

function ErrorMsg({ text }: { text: string }) {
  return <p className="text-center text-red-400 py-10 text-sm">{text}</p>;
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [, setLocation] = useLocation();

  // Guard — redirect to login if no key
  useEffect(() => {
    if (!getAdminKey()) setLocation("/admin");
  }, []);

  const handleLogout = () => {
    clearAdminKey();
    setLocation("/admin");
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-[#0d1424]/90 backdrop-blur-xl border-b border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-sm">LogHist Admin</span>
              <span className="text-xs text-slate-500 ml-2 hidden sm:inline">Веб-панель владельца</span>
            </div>
          </div>

          {/* Desktop tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === id ? "bg-cyan-500/15 text-cyan-400" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </nav>

          <button onClick={handleLogout}
            className="flex items-center gap-2 text-slate-400 hover:text-red-400 text-sm transition-colors px-3 py-2 rounded-xl hover:bg-red-500/10">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Выйти</span>
          </button>
        </div>

        {/* Mobile tabs */}
        <div className="md:hidden flex overflow-x-auto border-t border-white/8" style={{ scrollbarWidth: "none" }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`shrink-0 flex flex-col items-center gap-1 py-2.5 px-4 text-[11px] font-medium transition-colors whitespace-nowrap ${activeTab === id ? "text-cyan-400 border-b-2 border-cyan-400" : "text-slate-500"}`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 py-4 sm:py-8">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "ai" && <AiTab />}
        {activeTab === "audit" && <AuditTab />}
        {activeTab === "routes" && <RoutesTab />}
        {activeTab === "support" && <SupportTab />}
      </main>
    </div>
  );
}
