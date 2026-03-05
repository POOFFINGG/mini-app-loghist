import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bot, MessageCircle, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SupportChat } from "./SupportChat";

interface SupportPageProps {
  onBack: () => void;
  openChat?: boolean;
}

export function SupportPage({ onBack, openChat }: SupportPageProps) {
  const [showChat, setShowChat] = useState(openChat ?? false);

  useEffect(() => {
    if (openChat) setShowChat(true);
  }, [openChat]);

  if (showChat) {
    return <SupportChat onBack={() => setShowChat(false)} />;
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 h-full flex flex-col">
      <div className="flex items-center gap-4 shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-bold">Поддержка</h2>
      </div>

      {/* AI Chat Teaser */}
      <div className="bg-[#00b3f2]/10 rounded-2xl p-4 flex gap-4 items-center shrink-0">
        <div className="w-12 h-12 rounded-full bg-[#00b3f2] flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-[#00b3f2]">ИИ-Ассистент</h3>
          <p className="text-xs text-muted-foreground mt-1">Отвечает мгновенно 24/7. Поможет с заявками и документами.</p>
        </div>
        <Button size="sm" className="bg-[#00b3f2] hover:bg-[#009bd1]">Чат</Button>
      </div>

      {/* FAQ Search */}
      <div className="relative shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Поиск вопроса..." className="pl-9 bg-card" />
      </div>

      {/* FAQ Accordion */}
      <ScrollArea className="flex-1 -mx-4 px-4">
        <div className="space-y-4 pb-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Частые вопросы</h3>

          <Accordion type="single" collapsible className="w-full space-y-2">
            {[
              { q: "Как создать заявку?", a: "Перейдите в раздел 'Новая заявка', заполните форму вручную или воспользуйтесь ИИ-помощником, загрузив фото или текст." },
              { q: "Как добавить водителя?", a: "В разделе 'База данных' выберите вкладку 'Водители' и нажмите кнопку '+' в верхнем углу." },
              { q: "Как работает оплата?", a: "Оплата производится банковской картой или по счету. Счета формируются автоматически в разделе 'Финансы'." },
              { q: "Как изменить пароль?", a: "Перейдите в Профиль -> Безопасность -> Смена пароля." },
              { q: "Можно ли интегрировать 1С?", a: "Да, на тарифе Бизнес PRO доступна полная интеграция по API." },
            ].map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="bg-card border rounded-xl px-3">
                <AccordionTrigger className="hover:no-underline py-3 text-sm font-medium text-left">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-3">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="pt-4 border-t border-border/50">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Связаться с нами</h3>
            <Button
              variant="outline"
              className="w-full justify-between group h-12"
              onClick={() => setShowChat(true)}
            >
              <span className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" /> Написать оператору
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
