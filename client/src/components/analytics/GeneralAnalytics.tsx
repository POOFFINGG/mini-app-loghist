import {
  ResponsiveContainer,
  Tooltip,
  XAxis,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getUserAnalytics } from "@/lib/api";

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return String(n);
}

export function GeneralAnalytics() {
  const { data, isLoading } = useQuery({
    queryKey: ["user-analytics"],
    queryFn: getUserAnalytics,
    staleTime: 60_000,
  });

  if (isLoading || !data) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const growthPositive = data.growth >= 0;
  const revGrowthPositive = data.rev_growth >= 0;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-[#00b3f2]/10 to-transparent border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-[#00b3f2]/20 rounded-lg text-[#00b3f2]">
                <Package className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Заявок всего</span>
            </div>
            <div className="flex items-end gap-2">
              <h3 className="text-2xl font-bold">{data.total}</h3>
              <span className={`text-xs font-bold mb-1 flex items-center gap-0.5 ${growthPositive ? "text-green-500" : "text-red-500"}`}>
                {growthPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {growthPositive ? "+" : ""}{data.growth}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-green-500/20 rounded-lg text-green-600">
                <DollarSign className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Оборот</span>
            </div>
            <div className="flex items-end gap-2">
              <h3 className="text-2xl font-bold">{fmt(data.revenue)}</h3>
              <span className={`text-xs font-bold mb-1 flex items-center gap-0.5 ${revGrowthPositive ? "text-green-500" : "text-red-500"}`}>
                {revGrowthPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {revGrowthPositive ? "+" : ""}{data.rev_growth}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Динамика заявок</CardTitle>
          <CardDescription>Количество заявок за последние 6 месяцев</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            {data.monthly.every(m => m.requests === 0) ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Данных пока нет</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthly}>
                  <defs>
                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00b3f2" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00b3f2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#888" }} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                    cursor={{ stroke: "#00b3f2", strokeWidth: 1, strokeDasharray: "4 4" }}
                  />
                  <Area type="monotone" dataKey="requests" name="Заявки" stroke="#00b3f2" strokeWidth={3} fillOpacity={1} fill="url(#colorRequests)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Статус заявок</CardTitle>
        </CardHeader>
        <CardContent>
          {data.status_data.length === 0 ? (
            <div className="flex h-[100px] items-center justify-center text-sm text-muted-foreground">Данных пока нет</div>
          ) : (
            <div className="h-[200px] w-full flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.status_data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.status_data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} />
                  <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Routes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Топ маршрутов</CardTitle>
          <CardDescription>По количеству перевозок</CardDescription>
        </CardHeader>
        <CardContent>
          {data.top_routes.length === 0 ? (
            <div className="flex h-[60px] items-center justify-center text-sm text-muted-foreground">Маршрутов пока нет</div>
          ) : (
            <div className="space-y-4">
              {data.top_routes.map((route, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm truncate">{route.name}</span>
                      <span className="text-xs text-muted-foreground ml-2 shrink-0">{route.count} заяв.</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${route.pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
