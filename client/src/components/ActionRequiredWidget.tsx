import { CreditCard, FileCheck, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import type { LogisticsRequest } from "@/lib/api";

interface Props {
  items: LogisticsRequest[];
}

export function ActionRequiredWidget({ items }: Props) {
  const [, setLocation] = useLocation();
  if (!items || items.length === 0) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <h3 className="font-bold text-lg tracking-tight text-red-500">Требует внимания</h3>
      </div>
      <div className="space-y-2">
        {items.slice(0, 3).map((req) => {
          const isPayment = req.status === "Ожидает оплаты";
          return (
            <Card
              key={req.id}
              className="p-4 border-l-4 border-l-red-500 shadow-none flex items-center justify-between group cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setLocation("/requests/" + encodeURIComponent(req.id))}
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isPayment ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-500" : "bg-primary/10 text-primary"}`}>
                  {isPayment ? <CreditCard className="w-5 h-5" /> : <FileCheck className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-bold text-sm">{req.status}</h4>
                  <p className="text-xs text-muted-foreground">{req.number}</p>
                  {isPayment && req.payment?.rate && (
                    <p className="text-xs font-bold text-foreground mt-0.5">{req.payment.rate.toLocaleString("ru-RU")} ₽</p>
                  )}
                </div>
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground group-hover:text-primary">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}