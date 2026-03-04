import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  Truck, 
  User, 
  CreditCard, 
  FileText, 
  Download, 
  Copy, 
  Edit3, 
  History,
  MoreVertical,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function RequestDetail() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Mock data - in real app would come from params/query
  const request = {
    id: "#DPPO1-OTKA560",
    status: "В пути",
    createdAt: "09.08.2024",
    route: {
      origin: { city: "Москва", address: "ул. Ленина 1", date: "10.08.2024", time: "09:00" },
      destination: { city: "Казань", address: "ул. Пушкина 10", date: "11.08.2024", time: "18:00" }
    },
    cargo: {
      name: "Стройматериалы",
      weight: "20 тонн",
      volume: "82 м³",
      places: "33 паллеты"
    },
    transport: {
      type: "Фура (Тент)",
      plate: "А 777 АА 777",
      trailer: "ВЕ 1234 77",
      driver: "Иванов И.И. (+7 999 000-00-00)"
    },
    payment: {
      amount: "45 000 ₽",
      terms: "5 б.д. после оригиналов",
      status: "Ожидает документов"
    },
    documents: [
      { name: "Заявка.pdf", date: "09.08.2024" },
      { name: "ТрН.pdf", date: "10.08.2024" }
    ]
  };

  const handleClone = () => {
    toast({ title: "Заявка скопирована", description: "Создан черновик на основе текущей заявки" });
    setLocation("/create-request");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/requests">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold">{request.id}</h1>
            <span className="text-xs text-muted-foreground">от {request.createdAt}</span>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled={request.status !== "Требуется подтверждение"}>
              <Edit3 className="w-4 h-4 mr-2" /> Редактировать
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleClone}>
              <Copy className="w-4 h-4 mr-2" /> Клонировать
            </DropdownMenuItem>
            <DropdownMenuItem>
              <History className="w-4 h-4 mr-2" /> История изменений
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              Отменить заявку
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="p-4 space-y-6">
        
        {/* Status Card */}
        <div className="bg-card border rounded-2xl p-4 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 w-24 h-24 bg-[#00b3f2]/10 rounded-full blur-2xl -mr-10 -mt-10" />
           <div className="flex justify-between items-start mb-4 relative z-10">
              <div>
                <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Текущий статус</span>
                <div className="flex items-center gap-2 mt-1">
                   <div className="w-2.5 h-2.5 rounded-full bg-[#00b3f2] animate-pulse" />
                   <h2 className="text-xl font-bold text-[#00b3f2]">{request.status}</h2>
                </div>
              </div>
              <div className="text-right">
                 <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Оплата</span>
                 <p className="font-bold mt-1 text-foreground">{request.payment.amount}</p>
              </div>
           </div>
           
           {/* Progress Bar (Visual) */}
           <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mb-2">
             <div className="h-full w-[60%] bg-[#00b3f2] rounded-full" />
           </div>
           <p className="text-sm font-semibold text-muted-foreground/80 text-left mt-3" data-testid="text-eta">Ожидаемое прибытие: 11 августа</p>
        </div>

        {/* Route */}
        <div className="space-y-4 relative">
            <div className="absolute left-[19px] top-4 bottom-10 w-0.5 bg-border -z-10" />
            
            {/* Origin */}
            <div className="flex gap-4">
               <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 border-4 border-background">
                 <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
               </div>
               <div className="flex-1 pt-1">
                 <h3 className="font-bold text-lg leading-none">{request.route.origin.city}</h3>
                 <p className="text-[15px] text-muted-foreground mt-1 leading-snug">{request.route.origin.address}</p>
                 <div className="flex gap-4 mt-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium bg-secondary/50 px-2 py-1 rounded-md">
                      <Calendar className="w-3.5 h-3.5 opacity-70" /> {request.route.origin.date}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium bg-secondary/50 px-2 py-1 rounded-md">
                      <Clock className="w-3.5 h-3.5 opacity-70" /> {request.route.origin.time}
                    </div>
                 </div>
               </div>
            </div>

            {/* Destination */}
            <div className="flex gap-4">
               <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 border-4 border-background">
                 <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
               </div>
               <div className="flex-1 pt-1">
                 <h3 className="font-bold text-lg leading-none">{request.route.destination.city}</h3>
                 <p className="text-[15px] text-muted-foreground mt-1 leading-snug">{request.route.destination.address}</p>
                 <div className="flex gap-4 mt-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium bg-secondary/50 px-2 py-1 rounded-md">
                      <Calendar className="w-3.5 h-3.5 opacity-70" /> {request.route.destination.date}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium bg-secondary/50 px-2 py-1 rounded-md">
                      <Clock className="w-3.5 h-3.5 opacity-70" /> {request.route.destination.time}
                    </div>
                 </div>
               </div>
            </div>
        </div>

        <Separator />

        {/* Info Grid */}
        <div className="grid grid-cols-1 gap-4">
           {/* Cargo */}
           <div className="flex gap-3 items-start">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                 <h4 className="font-semibold text-[15px]">Груз</h4>
                 <p className="text-[15px] text-muted-foreground leading-snug">{request.cargo.name}</p>
                 <p className="text-[13px] text-muted-foreground/80 mt-1">
                   {request.cargo.weight} • {request.cargo.volume} • {request.cargo.places}
                 </p>
              </div>
           </div>

           {/* Transport */}
           <div className="flex gap-3 items-start">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Truck className="w-6 h-6 text-primary" />
              </div>
              <div>
                 <h4 className="font-semibold text-[15px]">Транспорт</h4>
                 <p className="text-[15px] text-muted-foreground leading-snug">{request.transport.type}</p>
                 <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline" className="text-[12px] h-6 px-2.5">{request.transport.plate}</Badge>
                    <Badge variant="outline" className="text-[12px] h-6 px-2.5">{request.transport.trailer}</Badge>
                 </div>
              </div>
           </div>

           {/* Driver */}
           <div className="flex gap-3 items-start">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                 <h4 className="font-semibold text-[15px]">Водитель</h4>
                 <p className="text-[15px] text-muted-foreground leading-snug">{request.transport.driver}</p>
              </div>
           </div>
        </div>

        <Separator />

        {/* Documents */}
        <div className="space-y-3">
           <div className="flex justify-between items-center">
             <h3 className="font-semibold text-[17px]">Документы</h3>
             <Button variant="ghost" size="sm" className="text-[13px] h-9">
               <Download className="w-3 h-3 mr-1" /> Скачать все
             </Button>
           </div>
           
           <div className="grid grid-cols-2 gap-3">
              {request.documents.map((doc, i) => (
                <div key={i} className="bg-secondary/30 border rounded-xl p-3 flex items-start justify-between group cursor-pointer hover:border-primary/50 transition-colors">
                   <div className="flex items-center gap-2">
                     <div className="w-8 h-8 rounded bg-white dark:bg-card flex items-center justify-center shadow-sm text-red-500">
                       <FileText className="w-4 h-4" />
                     </div>
                     <div className="flex flex-col overflow-hidden">
                       <span className="text-[13px] font-semibold truncate max-w-[160px]">{doc.name}</span>
                       <span className="text-[12px] text-muted-foreground/80">{doc.date}</span>
                     </div>
                   </div>
                </div>
              ))}
              
              <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-3 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:bg-secondary/20 cursor-pointer transition-colors min-h-[72px]">
                 <span className="text-xs font-medium">Добавить</span>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
