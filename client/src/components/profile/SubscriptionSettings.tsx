import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Loader2, AlertCircle, Star } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { updateSubscription } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props { onBack: () => void; }

type PlanKey = "free" | "pro" | "enterprise";

const PLANS: { key: PlanKey; name: string; price: string; color: string; features: string[] }[] = [
  {
    key: "free",
    name: "Базовый",
    price: "Бесплатно",
    color: "#64748b",
    features: ["До 5 заявок в месяц", "Базовая поддержка", "Хранение документов 1 ГБ"],
  },
  {
    key: "pro",
    name: "Стандарт",
    price: "990 ₽/мес",
    color: "#00b3f2",
    features: ["До 50 заявок в месяц", "ИИ-распознавание (100 шт)", "Хранение документов 10 ГБ", "Приоритетная поддержка"],
  },
  {
    key: "enterprise",
    name: "Бизнес PRO",
    price: "2 990 ₽/мес",
    color: "#7c3aed",
    features: ["Безлимит заявок", "ИИ-логист PRO (безлимит)", "Хранение документов 100 ГБ", "API доступ", "Персональный менеджер"],
  },
];

const PLAN_LABELS: Record<string, string> = { free: "Базовый", pro: "Стандарт", enterprise: "Бизнес PRO" };
const PLAN_COLORS: Record<string, string> = { free: "#64748b", pro: "#00b3f2", enterprise: "#7c3aed" };

function fmtDate(d?: string) {
  if (!d) return null;
  try { return format(parseISO(d), "dd MMMM yyyy", { locale: ru }); } catch { return null; }
}

export function SubscriptionSettings({ onBack }: Props) {
  const { user, refetchUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<PlanKey | null>(null);
  const [confirmPlan, setConfirmPlan] = useState<PlanKey | null>(null);

  const currentPlan = (user?.subscription_plan ?? "free") as PlanKey;
  const expiresDate = fmtDate(user?.subscription_expires);
  const isActive = currentPlan !== "free";
  const currentPlanData = PLANS.find(p => p.key === currentPlan) ?? PLANS[0];

  const handleChangePlan = async (plan: PlanKey) => {
    setLoading(plan);
    try {
      await updateSubscription(plan);
      await refetchUser();
      toast({
        title: plan === "free" ? "Подписка отменена" : "Тариф подключён",
        description: plan === "free"
          ? "Вы перешли на бесплатный тариф"
          : `Тариф «${PLAN_LABELS[plan]}» активирован на 30 дней`,
      });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e?.message, variant: "destructive" });
    } finally {
      setLoading(null);
      setConfirmPlan(null);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-bold">Подписка и оплата</h2>
      </div>

      {/* Current plan card */}
      <div
        className="rounded-2xl p-6 text-white shadow-lg relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${PLAN_COLORS[currentPlan]}, ${PLAN_COLORS[currentPlan]}aa)` }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-white/80 text-sm font-medium mb-1">Текущий тариф</p>
              <h3 className="text-2xl font-bold">{currentPlanData.name}</h3>
            </div>
            <Badge className="border-0 text-white bg-white/20">
              {isActive ? "Активен" : "Бесплатно"}
            </Badge>
          </div>
          {isActive ? (
            <div className="space-y-1 mb-5">
              {expiresDate && <p className="text-sm opacity-90">Действует до: {expiresDate}</p>}
              <p className="text-sm font-bold opacity-90">{currentPlanData.price}</p>
            </div>
          ) : (
            <p className="text-sm opacity-80 mb-5">Обновите тариф для доступа к полному функционалу</p>
          )}
          {isActive && (
            <Button
              className="w-full bg-white hover:bg-white/90 font-bold border-0"
              style={{ color: PLAN_COLORS[currentPlan] }}
              onClick={() => setConfirmPlan("free")}
              disabled={loading !== null}
            >
              Отменить подписку
            </Button>
          )}
        </div>
      </div>

      {/* Plan list */}
      <div className="space-y-3">
        <h3 className="text-[13px] font-bold text-muted-foreground/70 uppercase tracking-wider">Доступные тарифы</h3>
        <div className="grid gap-3">
          {PLANS.map(plan => {
            const isCurrent = plan.key === currentPlan;
            return (
              <div
                key={plan.key}
                className={`p-4 rounded-2xl border transition-all ${isCurrent ? "border-2 bg-card" : "bg-card border-border/50"}`}
                style={isCurrent ? { borderColor: plan.color } : {}}
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    {plan.key === "enterprise" && <Star className="w-4 h-4 fill-current" style={{ color: plan.color }} />}
                    <h4 className="font-bold text-[15px]">{plan.name}</h4>
                    {isCurrent && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5" style={{ borderColor: plan.color, color: plan.color }}>
                        Текущий
                      </Badge>
                    )}
                  </div>
                  <span className="font-bold text-sm" style={{ color: plan.color }}>{plan.price}</span>
                </div>
                <ul className="space-y-1.5 mb-4">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="w-3 h-3 text-green-500 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <Button size="sm" variant="outline" className="w-full" disabled>Активен</Button>
                ) : (
                  <Button
                    size="sm"
                    className="w-full text-white font-semibold"
                    style={{ background: plan.color }}
                    onClick={() => setConfirmPlan(plan.key)}
                    disabled={loading !== null}
                  >
                    {plan.key === "free" ? "Перейти на бесплатный" : `Подключить — ${plan.price}`}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Note */}
      <div className="bg-secondary/40 rounded-2xl p-4 border border-border/50">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            При смене тарифа изменения применяются немедленно. При переходе на более низкий тариф неиспользованные дни не возвращаются.
            Для оплаты по счёту (юрлица) — обратитесь в поддержку.
          </p>
        </div>
      </div>

      {/* Confirm dialog */}
      <AlertDialog open={!!confirmPlan} onOpenChange={open => !open && setConfirmPlan(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmPlan === "free" ? "Отменить подписку?" : `Подключить «${PLAN_LABELS[confirmPlan ?? "free"]}»?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmPlan === "free"
                ? "Вы перейдёте на бесплатный тариф. Доступ к PRO-функциям будет ограничен."
                : `Тариф «${PLAN_LABELS[confirmPlan ?? "free"]}» будет активирован на 30 дней. Стоимость: ${PLANS.find(p => p.key === confirmPlan)?.price}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!loading}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              disabled={!!loading}
              onClick={() => confirmPlan && handleChangePlan(confirmPlan)}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {confirmPlan === "free" ? "Отменить подписку" : "Подтвердить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
