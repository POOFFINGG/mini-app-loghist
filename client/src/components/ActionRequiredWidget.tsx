import { AlertTriangle, FileCheck, CreditCard, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ActionRequiredWidget() {
  const actions = [
    {
      id: 1,
      type: "payment",
      title: "Ожидает оплаты",
      description: "Заявка #REQ-2024-003",
      amount: "12 500 ₽",
      urgent: true
    },
    {
      id: 2,
      type: "document",
      title: "Подписать акт",
      description: "Доставка выполнена #REQ-2024-001",
      urgent: false
    }
  ];

  if (actions.length === 0) return null;

  return (
    <div className="space-y-3">
       <div className="flex items-center gap-2 px-1">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <h3 className="font-bold text-lg tracking-tight text-red-500">Требует внимания</h3>
       </div>

       <div className="space-y-2">
         {actions.map((action) => (
           <Card key={action.id} className="p-4 border-l-4 border-l-red-500 shadow-none flex items-center justify-between group cursor-pointer hover:bg-muted/50 transition-colors">
             <div className="flex items-center gap-3">
               <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${action.type === 'payment' ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-500' : 'bg-primary/10 text-primary'}`}>
                 {action.type === 'payment' ? <CreditCard className="w-5 h-5" /> : <FileCheck className="w-5 h-5" />}
               </div>
               <div>
                 <h4 className="font-bold text-sm">{action.title}</h4>
                 <p className="text-xs text-muted-foreground">{action.description}</p>
                 {action.amount && <p className="text-xs font-bold text-foreground mt-0.5">{action.amount}</p>}
               </div>
             </div>
             <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground group-hover:text-primary">
               <ArrowRight className="w-4 h-4" />
             </Button>
           </Card>
         ))}
       </div>
    </div>
  );
}
