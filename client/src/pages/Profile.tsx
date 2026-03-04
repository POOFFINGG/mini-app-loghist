import { motion } from "framer-motion";
import { ArrowLeft, User, Settings, Bell, LogOut, CreditCard, HelpCircle, Shield, BarChart3, Bot, Settings2 } from "lucide-react";
import logo from "@assets/logo.png";
import { Link, useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralAnalytics } from "@/components/analytics/GeneralAnalytics";
import { AiAnalytics } from "@/components/analytics/AiAnalytics";
import { useState } from "react";
import { PersonalData } from "@/components/profile/PersonalData";
import { NotificationsSettings } from "@/components/profile/NotificationsSettings";
import { SecuritySettings } from "@/components/profile/SecuritySettings";
import { SubscriptionSettings } from "@/components/profile/SubscriptionSettings";
import { SupportPage } from "@/components/profile/SupportPage";

export default function Profile() {
  const [activeTab, setActiveTab] = useState("profile");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    // In a real app, clear auth tokens here
    setLocation("/auth");
  };

  const renderProfileContent = () => {
    if (activeSection === "personal") return <PersonalData onBack={() => setActiveSection(null)} />;
    if (activeSection === "notifications") return <NotificationsSettings onBack={() => setActiveSection(null)} />;
    if (activeSection === "security") return <SecuritySettings onBack={() => setActiveSection(null)} />;
    if (activeSection === "subscription") return <SubscriptionSettings onBack={() => setActiveSection(null)} />;
    if (activeSection === "support") return <SupportPage onBack={() => setActiveSection(null)} />;

    return (
      <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
        {/* Profile Header Card */}
        <div className="bg-white dark:bg-card rounded-3xl p-6 border border-border/50 shadow-sm flex flex-col items-center relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
          
          <div className="w-24 h-24 rounded-full bg-secondary overflow-hidden border-4 border-background shadow-md relative z-10 mb-4">
            <img src={logo} alt="Avatar" className="w-full h-full object-contain" />
          </div>
          
          <div className="text-center relative z-10 mb-5">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Александр</h2>
            <p className="text-[15px] text-muted-foreground/80 font-medium mt-0.5">ООО "Логист"</p>
          </div>
          
          <button 
            onClick={() => setActiveSection("personal")}
            className="w-full py-2.5 rounded-xl bg-secondary/80 hover:bg-secondary text-foreground font-semibold text-[15px] transition-colors"
          >
            Редактировать профиль
          </button>
        </div>

        {/* Settings List */}
        <div className="space-y-3">
          <h3 className="text-[13px] font-bold text-muted-foreground/70 uppercase tracking-wider px-4">Настройки</h3>
          <div className="bg-white dark:bg-card rounded-3xl overflow-hidden border border-border/50 shadow-sm">
            {[
              { id: "personal", icon: User, label: "Личные данные" },
              { id: "notifications", icon: Bell, label: "Уведомления", badge: "2" },
              { id: "security", icon: Shield, label: "Безопасность" },
              { id: "subscription", icon: CreditCard, label: "Подписка и оплата" },
              { id: "support", icon: HelpCircle, label: "Поддержка" },
            ].map((item, i) => (
              <div 
                key={i} 
                onClick={() => setActiveSection(item.id)}
                className="flex items-center gap-4 p-4 hover:bg-secondary/40 transition-colors cursor-pointer border-b border-border/50 last:border-0 group"
              >
                <div className="w-10 h-10 rounded-xl bg-secondary/50 group-hover:bg-primary/10 group-hover:text-primary transition-colors flex items-center justify-center text-muted-foreground shrink-0">
                  <item.icon className="w-[22px] h-[22px]" strokeWidth={2} />
                </div>
                <div className="flex-1 font-semibold text-[15px] text-foreground/90">{item.label}</div>
                {item.badge && (
                  <div className="h-6 min-w-[24px] px-2 rounded-full bg-red-500 text-white text-[12px] flex items-center justify-center font-bold shadow-sm">
                    {item.badge}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="w-full p-4 rounded-3xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 font-bold flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors border border-red-100 dark:border-transparent"
        >
          <LogOut className="w-[20px] h-[20px]" strokeWidth={2.5} />
          Выйти из аккаунта
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-24 pt-4 px-4 bg-gray-50/50 dark:bg-background">
      <header className="flex items-center gap-4 mb-6">
        <Link href="/home">
          <button className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
        </Link>
        <h1 className="text-xl font-bold flex-1 text-center pr-10">
          {activeSection === "personal" && "Личные данные"}
          {activeSection === "notifications" && "Уведомления"}
          {activeSection === "security" && "Безопасность"}
          {activeSection === "subscription" && "Подписка"}
          {activeSection === "support" && "Поддержка"}
          {!activeSection && (
             <>
               {activeTab === "profile" && "Профиль"}
               {activeTab === "analytics" && "Аналитика"}
               {activeTab === "ai" && "AI Метрики"}
             </>
          )}
        </h1>
      </header>

      <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {!activeSection && (
          <div className="flex justify-center">
             <TabsList className="grid grid-cols-3 h-auto p-1 bg-white dark:bg-card border border-border/50 rounded-full w-full max-w-sm shadow-sm">
              <TabsTrigger value="profile" className="rounded-full py-2 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <User className="w-4 h-4 mr-1.5" /> Профиль
              </TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-full py-2 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <BarChart3 className="w-4 h-4 mr-1.5" /> Отчеты
              </TabsTrigger>
              <TabsTrigger value="ai" className="rounded-full py-2 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Bot className="w-4 h-4 mr-1.5" /> AI Panel
              </TabsTrigger>
            </TabsList>
          </div>
        )}

        <TabsContent value="profile" className="mt-0">
          {renderProfileContent()}
        </TabsContent>

        <TabsContent value="analytics" className="mt-0">
          <GeneralAnalytics />
        </TabsContent>

        <TabsContent value="ai" className="mt-0">
           <AiAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
