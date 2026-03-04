import { PlayCircle, FileText, ArrowRight, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function EducationalMaterials() {
  const materials = [
    {
      id: 1,
      title: "Как создать первую заявку",
      type: "video",
      duration: "2 мин",
      thumbnail: "bg-blue-100 dark:bg-blue-900/20",
      icon: PlayCircle
    },
    {
      id: 2,
      title: "Правила упаковки грузов",
      type: "article",
      duration: "5 мин",
      thumbnail: "bg-green-100 dark:bg-green-900/20",
      icon: FileText
    }
  ];

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-1">
        <h3 className="font-bold text-lg tracking-tight">База знаний</h3>
        <Button variant="link" className="text-xs h-auto p-0 text-primary font-bold uppercase">
          Все материалы
        </Button>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x hide-scrollbar">
        {materials.map((item) => (
          <Card key={item.id} className="min-w-[240px] snap-center border-border/50 shadow-sm hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="p-4 flex flex-col gap-3">
              <div className={`w-10 h-10 rounded-xl ${item.thumbnail} flex items-center justify-center text-primary`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm leading-tight mb-1 group-hover:text-primary transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs text-muted-foreground font-medium">
                  {item.type === 'video' ? 'Видео' : 'Статья'} • {item.duration}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {/* Support Card */}
        <Card className="min-w-[240px] snap-center border-border/50 shadow-sm bg-gradient-to-br from-[#00b3f2]/10 to-transparent">
          <CardContent className="p-4 flex flex-col gap-3 h-full justify-between">
            <div className="w-10 h-10 rounded-xl bg-[#00b3f2]/20 flex items-center justify-center text-[#00b3f2]">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm leading-tight mb-1">
                Нужна помощь?
              </h4>
              <p className="text-xs text-muted-foreground font-medium mb-3">
                Наш ИИ-помощник ответит на любые вопросы
              </p>
              <Button size="sm" className="w-full text-xs h-8 bg-[#00b3f2] hover:bg-[#009bd1]">
                Открыть чат
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
