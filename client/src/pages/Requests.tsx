import { motion } from "framer-motion";
import { Search, Clock, Calendar, FileText, ChevronRight, CircleDashed, BadgeCheck, Route, CircleAlert, Wallet, FileWarning, Archive, SlidersHorizontal } from "lucide-react";
import boxImage from "@assets/3d_cardboard_box_transparent_1768983759914.png";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";

const allStatuses = [
  "Требуется подтверждение",
  "Подтверждена",
  "В пути",
  "Требуется прикрепить документ",
  "Ожидает оплаты",
  "Оплачена",
  "В архив"
];

const requests = [
  { 
    id: "#DPPO1-OTKA560", 
    route: "Москва — Казань", 
    status: "В пути", 
    date: "09 Авг 2024", 
    progress: 60, 
    paymentDue: null
  },
  { 
    id: "#QWSO1-OTKAU69", 
    route: "СПб — Москва", 
    status: "Ожидает оплаты", 
    date: "09 Авг 2024", 
    progress: 100, 
    paymentDue: 3 // Days left
  },
  { 
    id: "#REQ-2024-003", 
    route: "Екб — Новосибирск", 
    status: "Требуется подтверждение", 
    date: "10 Авг 2024", 
    progress: 10, 
    paymentDue: null
  },
  { 
    id: "#REQ-2024-004", 
    route: "Краснодар — Сочи", 
    status: "Требуется прикрепить документ", 
    date: "08 Авг 2024", 
    progress: 90, 
    paymentDue: null
  },
];

export default function Requests() {
  const [, setLocation] = useLocation();
  const [dateRange, setDateRange] = useState<any>({});
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Все");

  const filteredRequests = requests.filter(req => {
    // Filter by tab
    if (activeTab === "В работе" && (req.status === "Завершен" || req.status === "Отменен")) return false;
    if (activeTab === "Завершенные" && req.status !== "Завершен") return false;
    if (activeTab === "Отмененные" && req.status !== "Отменен") return false;
    if (activeTab === "Требуют внимания" && (req.status !== "Требуется подтверждение" && req.status !== "Ожидает оплаты")) return false;
    if (activeTab === "Архив" && req.status !== "В архив") return false;

    // Filter by status dropdown
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(req.status)) return false;
    
    // Filter by search
    if (searchQuery && !req.id.toLowerCase().includes(searchQuery.toLowerCase()) && !req.route.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    return true;
  });

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const statusMeta: Record<string, { label: string; icon: any; chip: string; track: string }> = {
    "Требуется подтверждение": {
      label: "Требует подтверждения",
      icon: CircleAlert,
      chip: "bg-muted text-foreground border border-border/50",
      track: "from-primary/40 to-primary/10",
    },
    "Подтверждена": {
      label: "Подтверждена",
      icon: BadgeCheck,
      chip: "bg-green-500/10 text-green-700 dark:text-green-300 border border-green-500/20",
      track: "from-green-500/50 to-green-500/10",
    },
    "В пути": {
      label: "В пути",
      icon: Route,
      chip: "bg-muted text-foreground border border-border/50",
      track: "from-primary/55 via-primary/30 to-primary/10",
    },
    "Требуется прикрепить документ": {
      label: "Нужен документ",
      icon: FileWarning,
      chip: "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20",
      track: "from-red-500/50 to-red-500/10",
    },
    "Ожидает оплаты": {
      label: "Ожидает оплаты",
      icon: Wallet,
      chip: "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20",
      track: "from-red-500/50 to-red-500/10",
    },
    "Оплачена": {
      label: "Оплачена",
      icon: BadgeCheck,
      chip: "bg-green-500/10 text-green-700 dark:text-green-300 border border-green-500/20",
      track: "from-green-500/50 to-green-500/10",
    },
    "В архив": {
      label: "Архив",
      icon: Archive,
      chip: "bg-muted text-foreground border border-border/50",
      track: "from-primary/30 to-transparent",
    },
  };

  const getStatus = (status: string) => statusMeta[status] ?? {
    label: status,
    icon: CircleDashed,
    chip: "bg-muted text-foreground border border-border/50",
    track: "from-zinc-400 to-zinc-200",
  };

  return (
    <div className="min-h-screen pb-24 pt-4 px-4 space-y-4 bg-gray-50/50 dark:bg-background">
      <header className="flex flex-col gap-4 mb-2">
        <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Мои заявки</h1>
            
            <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full h-11 w-11 border-border/50 bg-white dark:bg-secondary" data-testid="button-requests-calendar">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <CalendarComponent
                      mode="range"
                      selected={dateRange}
                      onSelect={(range: any) => setDateRange(range)}
                      numberOfMonths={1}
                    />
                  </PopoverContent>
                </Popover>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className={`rounded-full h-11 w-11 border-border/50 bg-white dark:bg-secondary ${selectedStatuses.length > 0 ? 'border-primary text-primary' : ''}`} data-testid="button-requests-filters">
                      <SlidersHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Фильтр по статусу</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {allStatuses.map(status => (
                      <DropdownMenuCheckboxItem 
                        key={status}
                        checked={selectedStatuses.includes(status)}
                        onCheckedChange={() => toggleStatus(status)}
                      >
                        {status}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Поиск по номеру, маршруту..." 
            className="w-full h-11 pl-10 pr-4 rounded-2xl bg-white dark:bg-secondary border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/30"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-requests-search"
          />
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4">
        {["Все", "В работе", "Требуют внимания", "Архив"].map((tab, i) => (
          <button 
            key={i}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${
              activeTab === tab 
                ? 'bg-[#0f172a] text-white border-[#0f172a]' 
                : 'bg-white dark:bg-secondary text-muted-foreground border-transparent hover:bg-gray-100 dark:hover:bg-secondary/80'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredRequests.map((item, i) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-card rounded-[1.5rem] p-5 border border-gray-100 dark:border-border/50 shadow-sm relative overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
            onClick={() => setLocation(`/requests/${encodeURIComponent(item.id)}`)}
            data-testid={`card-request-${item.id}`}
          >
            {/* Payment Timer Indicator */}
            {item.paymentDue && (
               <div className="absolute top-0 right-0 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-500 px-3 py-1.5 rounded-bl-xl text-[11px] font-bold flex items-center gap-1">
                 <Clock className="w-3 h-3" />
                 Оплата через {item.paymentDue} дн.
               </div>
            )}

            {/* Top Row: Status & Image */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col gap-3 max-w-[70%]">
                {(() => {
                  const s = getStatus(item.status);
                  const Icon = s.icon;
                  return (
                    <span className={`self-start inline-flex items-center gap-2 text-[11px] px-3 py-1 rounded-full font-semibold ${s.chip} truncate max-w-full`} data-testid={`status-request-${item.id}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {s.label}
                    </span>
                  );
                })()}
                
                <div>
                  <h3 className="font-bold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">{item.id}</h3>
                  <p className="text-sm font-medium text-foreground/80 mb-2">{item.route}</p>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Дата доставки</span>
                    <span className="text-sm font-bold text-foreground">{item.date}</span>
                  </div>
                </div>
              </div>

              {/* 3D Box Image */}
              <div className="w-20 h-20 -mt-2 -mr-2 mix-blend-multiply dark:mix-blend-normal">
                <img 
                  src={boxImage} 
                  alt="Package" 
                  className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity" 
                  data-testid={`img-request-package-${item.id}`}
                />
              </div>
            </div>

            {/* Bottom: Progress Bar */}
            <div className="relative pt-2">
              {(() => {
                const s = getStatus(item.status);
                return (
                  <div className="h-1.5 w-full bg-gray-100 dark:bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full bg-gradient-to-r ${s.track}`}
                      style={{ width: `${item.progress}%` }} 
                    />
                  </div>
                );
              })()}
              
              {/* Floating Indicator */}
              <div 
                className="absolute top-2 -translate-y-1/2 -translate-x-1/2 transition-all duration-500"
                style={{ left: `${item.progress}%` }}
              >
                {(() => {
                  const s = getStatus(item.status);
                  const Icon = s.icon;
                  return (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-md bg-background">
                      <div className={`w-full h-full rounded-full flex items-center justify-center ${s.chip.replace('border border-','border-').replace(' border ',' ')} border`}> 
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
            
            {/* Quick Action Overlay (Desktop mainly, but good for touch) */}
            <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
               <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                 <ChevronRight className="w-4 h-4" />
               </div>
            </div>
          </motion.div>
        ))}

        {filteredRequests.length === 0 && (
          <EmptyState 
            title="Заявок не найдено" 
            description="Попробуйте изменить фильтры или создайте новую заявку"
            actionLabel="Создать заявку"
            onAction={() => setLocation("/create-request")}
          />
        )}
      </div>
    </div>
  );
}
