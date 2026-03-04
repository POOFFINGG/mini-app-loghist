import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis, 
  LineChart,
  Line
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrainCircuit, FileDown, CheckCircle, Search } from "lucide-react";

const aiUsageData = [
  { name: "Пн", calls: 45 },
  { name: "Вт", calls: 62 },
  { name: "Ср", calls: 58 },
  { name: "Чт", calls: 85 },
  { name: "Пт", calls: 70 },
  { name: "Сб", calls: 30 },
  { name: "Вс", calls: 25 },
];

const accuracyData = [
  { name: "W1", acc: 88 },
  { name: "W2", acc: 92 },
  { name: "W3", acc: 91 },
  { name: "W4", acc: 95 },
];

export function AiAnalytics() {
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-purple-500/20 rounded-lg text-purple-600">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Обращений</span>
            </div>
            <div className="flex items-end gap-2">
              <h3 className="text-2xl font-bold">1,240</h3>
              <span className="text-xs text-purple-500 font-bold mb-1">+24%</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-indigo-500/10 to-transparent border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-600">
                <CheckCircle className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Точность</span>
            </div>
            <div className="flex items-end gap-2">
              <h3 className="text-2xl font-bold">95.2%</h3>
              <span className="text-xs text-indigo-500 font-bold mb-1">+2%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Активность использования</CardTitle>
          <CardDescription>Количество запросов к ИИ за неделю</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aiUsageData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="calls" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Популярные запросы</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
             {[
               { query: "Распознать реквизиты", count: 450, percent: 35 },
               { query: "Создать заявку из фото", count: 320, percent: 28 },
               { query: "Поиск водителя", count: 180, percent: 15 },
               { query: "Расчет стоимости", count: 120, percent: 10 },
             ].map((item, i) => (
               <div key={i} className="flex flex-col gap-1">
                 <div className="flex justify-between text-sm">
                   <span className="font-medium flex items-center gap-2">
                     <Search className="w-3 h-3 text-muted-foreground" />
                     {item.query}
                   </span>
                   <span className="text-muted-foreground">{item.count}</span>
                 </div>
                 <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-indigo-500 rounded-full" 
                     style={{ width: `${item.percent * 2}%` }} // Scale visually
                   />
                 </div>
               </div>
             ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="w-full gap-2">
          <FileDown className="w-4 h-4" />
          PDF Отчет
        </Button>
        <Button variant="outline" className="w-full gap-2">
          <FileDown className="w-4 h-4" />
          Excel Данные
        </Button>
      </div>
    </div>
  );
}
