import { motion } from "framer-motion";
import { Search, Bell, Plus, ArrowRight, FileText, Truck, Users, Bot, Moon, Sun, Wallet } from "lucide-react";
import { Link } from "wouter";
import { useTheme } from "next-themes";
import activeShipmentIcon from "@assets/generated_images/blue_glassmorphism_shipping_box_3d.png";
import logo from "@assets/logo.png";
import { useState } from "react";
import { NotificationCenter } from "@/components/NotificationCenter";
import { ActionRequiredWidget } from "@/components/ActionRequiredWidget";
import { EducationalMaterials } from "@/components/EducationalMaterials";

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);

  // Mock data for counters
  const activeRequestsCount = 12;
  const actionRequiredCount = 2; // Matches items in ActionRequiredWidget

  return (
    <div className="min-h-screen pb-24 pt-4 px-4 space-y-6 font-sans">
      {/* Header */}
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden border border-border shadow-soft">
            <img src={logo} alt="Avatar" className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="text-sm text-muted-foreground tracking-tight">Добрый день,</h2>
            <h1 className="font-bold text-lg tracking-tight">Александр</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full bg-secondary hover:bg-secondary/80 text-foreground transition-colors shadow-soft"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setShowNotifications(true)}
            className="p-2 rounded-full bg-secondary hover:bg-secondary/80 text-foreground transition-colors relative shadow-soft"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#00b3f2] rounded-full border border-secondary" />
          </button>
        </div>
      </header>

      <NotificationCenter open={showNotifications} onOpenChange={setShowNotifications} />

      {/* Action Required Widget */}
      <ActionRequiredWidget />

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: Plus, label: "Новая заявка", path: "/create-request" },
          { icon: Bot, label: "ИИ Помощник" },
          { icon: Truck, label: "Транспорт", path: "/database" },
          { icon: Wallet, label: "Финансы", path: "/database" },
        ].map((action, i) => (
          <Link key={i} href={action.path || "#"}>
            <motion.div 
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-2 cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-[1.2rem] bg-secondary/30 backdrop-blur-sm border border-white/40 shadow-sm flex items-center justify-center mb-1 transition-all group-hover:bg-primary/10 group-hover:border-primary/30 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-50" />
                <action.icon className="w-7 h-7 text-[#00b3f2] relative z-10 drop-shadow-sm" strokeWidth={2} />
              </div>
              <span className="text-[10px] leading-tight font-bold text-center text-foreground/80 group-hover:text-primary transition-colors tracking-tight">{action.label}</span>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* Stats Counters */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-card rounded-[1.5rem] p-5 border border-border/50 shadow-soft backdrop-blur-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10" />
          <p className="text-xs font-bold text-muted-foreground mb-1 tracking-wide uppercase opacity-70">В работе</p>
          <h3 className="text-3xl font-black text-foreground tracking-tighter">{activeRequestsCount}</h3>
          <p className="text-[10px] text-primary font-bold mt-1 tracking-wide">АКТИВНЫЕ ЗАЯВКИ</p>
        </div>
        <div className="bg-white dark:bg-card rounded-[1.5rem] p-5 border border-border/50 shadow-soft backdrop-blur-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 w-20 h-20 bg-[#005c7d]/10 rounded-full blur-2xl -mr-10 -mt-10" />
          <p className="text-xs font-bold text-muted-foreground mb-1 tracking-wide uppercase opacity-70">Ожидают</p>
          <h3 className="text-3xl font-black text-foreground tracking-tighter">{actionRequiredCount}</h3>
          <p className="text-[10px] text-muted-foreground font-bold mt-1 tracking-wide">ТРЕБУЮТ ВНИМАНИЯ</p>
        </div>
      </div>

      {/* Active Shipment Card - Redesigned "Pro" Version */}
      <Link href="/requests">
        <motion.div 
          whileTap={{ scale: 0.99 }}
          className="w-full relative h-52 rounded-[2rem] overflow-hidden mt-4 cursor-pointer group shadow-2xl bg-black"
        >
          {/* 1. Background Layers */}
          <div className="absolute inset-0 z-0">
             {/* Subtle gradient glow from bottom-right (Blue) */}
             <div className="absolute bottom-0 right-0 w-3/4 h-3/4 bg-[#00b3f2]/20 blur-[80px] rounded-full opacity-60" />
             {/* Map/Grid Pattern Overlay */}
             <div className="absolute inset-0 opacity-[0.05]" 
                  style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} 
             />
          </div>

          {/* 2. 3D Image Layer - Positioned for impact */}
          <div className="absolute right-[-20px] top-1/2 -translate-y-1/2 w-[50%] h-[80%] z-10 pointer-events-none mix-blend-screen">
             <img 
               src={activeShipmentIcon} 
               className="w-full h-full object-contain scale-110 group-hover:scale-115 transition-transform duration-700 ease-out opacity-100 drop-shadow-[0_0_20px_rgba(0,179,242,0.5)]" 
               alt="Active Shipment" 
             />
          </div>

          {/* 3. Content Layer */}
          <div className="relative z-20 p-6 flex flex-col justify-between h-full">
            
            {/* Top: Header */}
            <div className="flex justify-between items-start">
               <div>
                 <div className="flex items-center gap-2 mb-1.5">
                   <span className="flex h-2 w-2 relative">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00b3f2] opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00b3f2]"></span>
                   </span>
                   <span className="text-[10px] font-bold text-[#00b3f2] tracking-wider uppercase">Active Status</span>
                 </div>
                 <h2 className="text-2xl font-black text-white tracking-tight leading-none">В ПУТИ</h2>
               </div>
               
               <div className="bg-white/10 backdrop-blur-md border border-white/10 px-2 py-1 rounded-lg">
                 <span className="text-[9px] font-bold font-mono text-white/90">#REQ-2024-001</span>
               </div>
            </div>

            {/* Middle: Route Info (Abstracted) */}
            <div className="flex flex-col gap-0.5">
               <p className="text-xs text-gray-400 font-bold tracking-wide uppercase">Ожидаемая дата</p>
               <p className="text-lg font-bold text-white tracking-tight">09 Авг 2024</p>
            </div>

            {/* Bottom: Progress & Route */}
            <div className="space-y-2.5">
               {/* Progress Bar */}
               <div className="relative h-1.5 w-full bg-gray-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "65%" }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#00b3f2] via-[#5ed3ff] to-[#b2e9ff] shadow-[0_0_15px_rgba(0,179,242,0.6)]"
                  />
               </div>

               {/* Route Labels */}
               <div className="flex justify-between items-center text-[10px] font-bold text-white/90 tracking-wide">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-gray-500" />
                    <span>МОСКВА</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>САНКТ-ПЕТЕРБУРГ</span>
                    <div className="w-1 h-1 rounded-full bg-[#00b3f2] shadow-[0_0_5px_rgba(0,179,242,0.8)]" />
                  </div>
               </div>
            </div>

          </div>
        </motion.div>
      </Link>

      {/* Educational Materials Section */}
      <EducationalMaterials />
    </div>
  );
}
