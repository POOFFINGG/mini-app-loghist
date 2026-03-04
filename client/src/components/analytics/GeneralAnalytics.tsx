import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, TrendingUp, DollarSign, Package } from "lucide-react";

const requestsData = [
  { name: "Янв", requests: 12 },
  { name: "Фев", requests: 19 },
  { name: "Мар", requests: 35 },
  { name: "Апр", requests: 28 },
  { name: "Май", requests: 42 },
  { name: "Июн", requests: 55 },
];

const statusData = [
  { name: "В работе", value: 45, color: "#00b3f2" },
  { name: "Завершены", value: 30, color: "#10b981" },
  { name: "Отменены", value: 10, color: "#ef4444" },
  { name: "Черновики", value: 15, color: "#94a3b8" },
];

const routesData = [
  { name: "Мск-Спб", value: 45000 },
  { name: "Мск-Кзн", value: 32000 },
  { name: "Спб-Мск", value: 28000 },
  { name: "Екб-Мск", value: 18000 },
];

export function GeneralAnalytics() {
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
              <h3 className="text-2xl font-bold">148</h3>
              <span className="text-xs text-green-500 font-bold mb-1">+12%</span>
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
              <h3 className="text-2xl font-bold">4.2M</h3>
              <span className="text-xs text-green-500 font-bold mb-1">+5%</span>
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
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={requestsData}>
                <defs>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00b3f2" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00b3f2" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  cursor={{ stroke: '#00b3f2', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area type="monotone" dataKey="requests" stroke="#00b3f2" strokeWidth={3} fillOpacity={1} fill="url(#colorRequests)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Статус заявок</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Routes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Топ маршрутов</CardTitle>
          <CardDescription>По объему перевозок</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
             {routesData.map((route, i) => (
               <div key={i} className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">
                     {i + 1}
                   </div>
                   <span className="font-medium text-sm">{route.name}</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="h-2 w-24 bg-secondary rounded-full overflow-hidden">
                     <div 
                       className="h-full bg-primary rounded-full" 
                       style={{ width: `${(route.value / 50000) * 100}%` }}
                     />
                   </div>
                 </div>
               </div>
             ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Button */}
      <Button variant="outline" className="w-full gap-2">
        <Download className="w-4 h-4" />
        Скачать отчет (PDF)
      </Button>
    </div>
  );
}
