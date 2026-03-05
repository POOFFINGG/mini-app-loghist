import { motion } from "framer-motion";
import { Bell, Plus, Bot, Truck, Wallet, Moon, Sun } from "lucide-react";
import { Link } from "wouter";
import { useTheme } from "next-themes";
import activeShipmentIcon from "@assets/generated_images/blue_glassmorphism_shipping_box_3d.png";
import logo from "@assets/logo.png";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { NotificationCenter } from "@/components/NotificationCenter";
import { ActionRequiredWidget } from "@/components/ActionRequiredWidget";
import { EducationalMaterials } from "@/components/EducationalMaterials";
import { useAuth } from "@/lib/auth-context";
import { listRequests, getUnreadCount, type LogisticsRequest } from "@/lib/api";

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const { user } = useAuth();

  const { data: requests = [] } = useQuery<LogisticsRequest[]>({
    queryKey: ["requests", "active"],
    queryFn: () => listRequests({ limit: 50 }),
    staleTime: 30000,
  });

  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => getUnreadCount(),
    staleTime: 60000,
    refetchInterval: 60000,
  });

  const activeRequests = requests.filter(r => !["Оплачена", "В архив"].includes(r.status));
  const actionRequired = requests.filter(r => ["Требуется подтверждение", "Ожидает оплаты", "Требуется прикрепить документ"].includes(r.status));

  const nameParts = user?.personal?.full_name?.split(" ") ?? [];
  const firstName = nameParts[1] ?? nameParts[0] ?? user?.logistician?.phone ?? "Логист";

  // Most recent active request with status "В пути"
  const activeShipment = requests.find(r => r.status === "В пути") ?? requests[0];

  const progressMap: Record<string, number> = {
    "Требуется подтверждение": 10,
    "Подтверждена": 30,
    "В пути": 65,
    "Требуется прикрепить документ": 90,
    "Ожидает оплаты": 95,
    "Оплачена": 100,
    "В архив": 100,
  };

  return (
    <div className="min-h-screen pb-24 pt-4 px-4 space-y-6 font-sans">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden border border-border shadow-soft">
            <img src={logo} alt="Avatar" className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="text-sm text-muted-foreground tracking-tight">Добрый день,</h2>
            <h1 className="font-bold text-lg tracking-tight">{firstName}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full bg-secondary hover:bg-secondary/80 text-foreground transition-colors shadow-soft"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setShowNotifications(true)}
            className="p-2 rounded-full bg-secondary hover:bg-secondary/80 text-foreground transition-colors relative shadow-soft"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#00b3f2] rounded-full border border-secondary" />
            )}
          </button>
        </div>
      </header>

      <NotificationCenter open={showNotifications} onOpenChange={setShowNotifications} />

      {actionRequired.length > 0 && <ActionRequiredWidget items={actionRequired} />}

      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: Plus, label: "Новая заявка", path: "/create-request" },
          { icon: Bot, label: "ИИ Помощник", path: "/create-request" },
          { icon: Truck, label: "Транспорт", path: "/database" },
          { icon: Wallet, label: "Финансы", path: "/database" },
        ].map((action, i) => (
          <Link key={i} href={action.path}>
            <motion.div whileTap={{ scale: 0.95 }} className="flex flex-col items-center gap-2 cursor-pointer group">
              <div className="w-16 h-16 rounded-[1.2rem] bg-secondary/30 backdrop-blur-sm border border-white/40 shadow-sm flex items-center justify-center mb-1 transition-all group-hover:bg-primary/10 group-hover:border-primary/30 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-50" />
                <action.icon className="w-7 h-7 text-[#00b3f2] relative z-10 drop-shadow-sm" strokeWidth={2} />
              </div>
              <span className="text-[10px] leading-tight font-bold text-center text-foreground/80 group-hover:text-primary transition-colors tracking-tight">{action.label}</span>
            </motion.div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-card rounded-[1.5rem] p-5 border border-border/50 shadow-soft backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10" />
          <p className="text-xs font-bold text-muted-foreground mb-1 tracking-wide uppercase opacity-70">В работе</p>
          <h3 className="text-3xl font-black text-foreground tracking-tighter">{activeRequests.length}</h3>
          <p className="text-[10px] text-primary font-bold mt-1 tracking-wide">АКТИВНЫЕ ЗАЯВКИ</p>
        </div>
        <div className="bg-white dark:bg-card rounded-[1.5rem] p-5 border border-border/50 shadow-soft backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-[#005c7d]/10 rounded-full blur-2xl -mr-10 -mt-10" />
          <p className="text-xs font-bold text-muted-foreground mb-1 tracking-wide uppercase opacity-70">Ожидают</p>
          <h3 className="text-3xl font-black text-foreground tracking-tighter">{actionRequired.length}</h3>
          <p className="text-[10px] text-muted-foreground font-bold mt-1 tracking-wide">ТРЕБУЮТ ВНИМАНИЯ</p>
        </div>
      </div>

      {activeShipment ? (
        <Link href={"/requests/" + encodeURIComponent(activeShipment.id)}>
          <motion.div
            whileTap={{ scale: 0.99 }}
            className="w-full relative h-52 rounded-[2rem] overflow-hidden mt-4 cursor-pointer group shadow-2xl bg-black"
          >
            <div className="absolute inset-0 z-0">
              <div className="absolute bottom-0 right-0 w-3/4 h-3/4 bg-[#00b3f2]/20 blur-[80px] rounded-full opacity-60" />
              <div className="absolute inset-0 opacity-[0.05]"
                style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "24px 24px" }}
              />
            </div>
            <div className="absolute right-[-20px] top-1/2 -translate-y-1/2 w-[50%] h-[80%] z-10 pointer-events-none mix-blend-screen">
              <img src={activeShipmentIcon} className="w-full h-full object-contain scale-110 group-hover:scale-115 transition-transform duration-700 ease-out opacity-100 drop-shadow-[0_0_20px_rgba(0,179,242,0.5)]" alt="Active Shipment" />
            </div>
            <div className="relative z-20 p-6 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00b3f2] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00b3f2]"></span>
                    </span>
                    <span className="text-[10px] font-bold text-[#00b3f2] tracking-wider uppercase">Active Status</span>
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight leading-none">{activeShipment.status.toUpperCase()}</h2>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/10 px-2 py-1 rounded-lg">
                  <span className="text-[9px] font-bold font-mono text-white/90">{activeShipment.request_number}</span>
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-xs text-gray-400 font-bold tracking-wide uppercase">Маршрут</p>
                <p className="text-lg font-bold text-white tracking-tight">
                  {activeShipment.origin?.address?.split(",")[0] ?? "—"} → {activeShipment.destination?.address?.split(",")[0] ?? "—"}
                </p>
              </div>
              <div className="space-y-2.5">
                <div className="relative h-1.5 w-full bg-gray-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: (progressMap[activeShipment.status] ?? 50) + "%" }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#00b3f2] via-[#5ed3ff] to-[#b2e9ff] shadow-[0_0_15px_rgba(0,179,242,0.6)]"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </Link>
      ) : (
        <Link href="/create-request">
          <div className="w-full h-32 rounded-[2rem] border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-secondary/30 transition-colors">
            <div className="text-center">
              <Plus className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium text-muted-foreground">Создать первую заявку</p>
            </div>
          </div>
        </Link>
      )}

      <EducationalMaterials />
    </div>
  );
}