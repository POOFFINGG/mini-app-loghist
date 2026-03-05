import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BrainCircuit, CheckCircle, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getAiUsage } from "@/lib/api";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

export function AiAnalytics() {
  const { data: aiUsage = [], isLoading } = useQuery({
    queryKey: ["ai-usage"],
    queryFn: () => getAiUsage("week"),
    staleTime: 60000,
  });

  const totalCalls = aiUsage.reduce((sum: number, d: any) => sum + (d.calls ?? 0), 0);
  const totalCost = aiUsage.reduce((sum: number, d: any) => sum + (d.cost ?? 0), 0);

  const chartData = aiUsage.map((d: any) => ({
    name: d.date ? format(parseISO(d.date), "EEE", { locale: ru }) : d.name,
    calls: d.calls ?? 0,
  }));

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-purple-500/20 rounded-lg text-purple-600"><BrainCircuit className="w-4 h-4" /></div>
              <span className="text-xs font-medium text-muted-foreground">Обращений за неделю</span>
            </div>
            <h3 className="text-2xl font-bold">{totalCalls.toLocaleString("ru-RU")}</h3>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-indigo-500/10 to-transparent border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-600"><CheckCircle className="w-4 h-4" /></div>
              <span className="text-xs font-medium text-muted-foreground">Стоимость (₽)</span>
            </div>
            <h3 className="text-2xl font-bold">{(totalCost * 90).toFixed(2)}</h3>
          </CardContent>
        </Card>
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Активность использования ИИ</CardTitle>
            <CardDescription>Количество запросов к ИИ за неделю</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#888" }} />
                  <Tooltip cursor={{ fill: "transparent" }} contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                  <Bar dataKey="calls" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {chartData.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <BrainCircuit className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Нет данных об использовании ИИ</p>
          <p className="text-xs mt-1">Данные появятся после первого запроса к ИИ</p>
        </div>
      )}
    </div>
  );
}