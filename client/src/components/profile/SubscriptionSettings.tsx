import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, CreditCard, Zap } from "lucide-react";

interface SubscriptionSettingsProps {
  onBack: () => void;
}

export function SubscriptionSettings({ onBack }: SubscriptionSettingsProps) {
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-bold">Подписка и оплата</h2>
      </div>

      {/* Current Plan */}
      <div className="bg-gradient-to-br from-[#00b3f2] to-[#0087b5] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">Текущий тариф</p>
              <h3 className="text-2xl font-bold">Бизнес PRO</h3>
            </div>
            <Badge className="bg-white/20 hover:bg-white/30 text-white border-0">Активен</Badge>
          </div>
          
          <div className="space-y-1 mb-6">
            <p className="text-sm opacity-90">Следующее списание: 15.03.2025</p>
            <p className="text-sm opacity-90 font-bold">2 990 ₽ / мес</p>
          </div>

          <Button className="w-full bg-white text-[#0087b5] hover:bg-white/90 font-bold border-0">
            Управление подпиской
          </Button>
        </div>
      </div>

      {/* Tariffs */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Доступные тарифы</h3>
        
        <div className="grid gap-3">
          {[
            { name: "Базовый", price: "Бесплатно", features: ["До 5 заявок в месяц", "Базовая поддержка"] },
            { name: "Стандарт", price: "990 ₽", features: ["До 50 заявок", "ИИ-распознавание (100 шт)", "Приоритетная поддержка"] },
            { name: "Бизнес PRO", price: "2 990 ₽", features: ["Безлимит заявок", "ИИ-логист PRO", "API доступ", "Персональный менеджер"], active: true },
          ].map((plan, i) => (
            <div key={i} className={`p-4 rounded-xl border ${plan.active ? 'border-[#00b3f2] bg-[#00b3f2]/5 ring-1 ring-[#00b3f2]/20' : 'bg-card'}`}>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold">{plan.name}</h4>
                <span className="font-bold text-primary">{plan.price}</span>
              </div>
              <ul className="space-y-1.5 mb-3">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="w-3 h-3 text-green-500" /> {f}
                  </li>
                ))}
              </ul>
              {plan.active ? (
                <Button size="sm" variant="outline" className="w-full border-[#00b3f2] text-[#00b3f2]" disabled>Текущий план</Button>
              ) : (
                <Button size="sm" variant="outline" className="w-full">Перейти</Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Payment History */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">История платежей</h3>
        <div className="bg-card rounded-xl border divide-y divide-border/50">
          {[
            { date: "15.02.2025", amount: "2 990 ₽", status: "Успешно" },
            { date: "15.01.2025", amount: "2 990 ₽", status: "Успешно" },
            { date: "15.12.2024", amount: "2 990 ₽", status: "Успешно" },
          ].map((payment, i) => (
            <div key={i} className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-bold">Продление подписки</p>
                  <p className="text-xs text-muted-foreground">{payment.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{payment.amount}</p>
                <p className="text-[10px] text-green-500 font-bold uppercase">{payment.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
