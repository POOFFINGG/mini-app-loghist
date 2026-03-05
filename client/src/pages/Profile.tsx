import { User, Bell, Shield, CreditCard, HelpCircle, LogOut, BarChart3, Bot, Crown } from "lucide-react";
import logo from "@assets/logo.png";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralAnalytics } from "@/components/analytics/GeneralAnalytics";
import { AiAnalytics } from "@/components/analytics/AiAnalytics";
import { useState, useEffect } from "react";
import { PersonalData } from "@/components/profile/PersonalData";
import { NotificationsSettings } from "@/components/profile/NotificationsSettings";
import { SecuritySettings } from "@/components/profile/SecuritySettings";
import { SubscriptionSettings } from "@/components/profile/SubscriptionSettings";
import { SupportPage } from "@/components/profile/SupportPage";
import { useAuth } from "@/lib/auth-context";
import { logout } from "@/lib/api";

export default function Profile() {
  const [activeTab, setActiveTab] = useState("profile");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [location, setLocation] = useLocation();
  const { user, signOut } = useAuth();

  // Handle deep-link from notifications: /profile?section=support&chat=1
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const section = params.get("section");
    const chat = params.get("chat");
    if (section === "support") {
      setActiveSection("support");
      if (chat === "1") {
        setSupportOpenChat(true);
      }
      window.history.replaceState({}, "", "/profile");
    } else if (section === "notifications") {
      setActiveSection("notifications");
      window.history.replaceState({}, "", "/profile");
    }
  }, []);

  const [supportOpenChat, setSupportOpenChat] = useState(false);

  const handleLogout = async () => {
    try { await logout(); } catch {}
    signOut();
    setLocation("/auth");
  };

  const fullName = user?.personal?.full_name ?? "Пользователь";
  const companyName = user?.company?.name ?? "";

  const renderProfileContent = () => {
    if (activeSection === "personal") return <PersonalData onBack={() => setActiveSection(null)} />;
    if (activeSection === "notifications") return <NotificationsSettings onBack={() => setActiveSection(null)} />;
    if (activeSection === "security") return <SecuritySettings onBack={() => setActiveSection(null)} />;
    if (activeSection === "subscription") return <SubscriptionSettings onBack={() => setActiveSection(null)} />;
    if (activeSection === "support") return <SupportPage onBack={() => { setActiveSection(null); setSupportOpenChat(false); }} openChat={supportOpenChat} />;

    return (
      <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
        <div className="bg-white dark:bg-card rounded-3xl p-6 border border-border/50 shadow-sm flex flex-col items-center relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
          <div className="w-24 h-24 rounded-full bg-secondary overflow-hidden border-4 border-background shadow-md relative z-10 mb-4">
            <img src={logo} alt="Avatar" className="w-full h-full object-contain" />
          </div>
          <div className="text-center relative z-10 mb-5">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{fullName}</h2>
            {companyName && <p className="text-[15px] text-muted-foreground/80 font-medium mt-0.5">{companyName}</p>}
            {user?.logistician?.email && <p className="text-xs text-muted-foreground mt-0.5">{user.logistician.email}</p>}
            {user?.subscription_plan && user.subscription_plan !== "free" && (
              <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-bold text-white"
                style={{ background: user.subscription_plan === "enterprise" ? "#7c3aed" : "#00b3f2" }}>
                <Crown className="w-3 h-3" />
                {user.subscription_plan === "enterprise" ? "Бизнес PRO" : "Стандарт"}
              </div>
            )}
          </div>
          <button onClick={() => setActiveSection("personal")}
            className="w-full py-2.5 rounded-xl bg-secondary/80 hover:bg-secondary text-foreground font-semibold text-[15px] transition-colors">
            Редактировать профиль
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="text-[13px] font-bold text-muted-foreground/70 uppercase tracking-wider px-4">Настройки</h3>
          <div className="bg-white dark:bg-card rounded-3xl overflow-hidden border border-border/50 shadow-sm">
            {[
              { id: "personal", icon: User, label: "Личные данные" },
              { id: "notifications", icon: Bell, label: "Уведомления" },
              { id: "security", icon: Shield, label: "Безопасность" },
              { id: "subscription", icon: CreditCard, label: "Подписка и оплата" },
              { id: "support", icon: HelpCircle, label: "Поддержка" },
            ].map((item, i) => (
              <div key={i} onClick={() => setActiveSection(item.id)}
                className="flex items-center gap-4 p-4 hover:bg-secondary/40 transition-colors cursor-pointer border-b border-border/50 last:border-0 group">
                <div className="w-10 h-10 rounded-xl bg-secondary/50 group-hover:bg-primary/10 group-hover:text-primary transition-colors flex items-center justify-center text-muted-foreground shrink-0">
                  <item.icon className="w-[22px] h-[22px]" strokeWidth={2} />
                </div>
                <div className="flex-1 font-semibold text-[15px] text-foreground/90">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={handleLogout}
          className="w-full p-4 rounded-3xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 font-bold flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors border border-red-100 dark:border-transparent">
          <LogOut className="w-[20px] h-[20px]" strokeWidth={2.5} />
          Выйти из аккаунта
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-24 pt-4 px-4 bg-gray-50/50 dark:bg-background">
      <header className="flex items-center gap-4 mb-6">
        <h1 className="text-xl font-bold flex-1 text-center">
          {activeSection === "personal" && "Личные данные"}
          {activeSection === "notifications" && "Уведомления"}
          {activeSection === "security" && "Безопасность"}
          {activeSection === "subscription" && "Подписка"}
          {activeSection === "support" && "Поддержка"}
          {!activeSection && (<>{activeTab === "profile" && "Профиль"}{activeTab === "analytics" && "Аналитика"}{activeTab === "ai" && "AI Panel"}</>)}
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
        <TabsContent value="profile" className="mt-0">{renderProfileContent()}</TabsContent>
        <TabsContent value="analytics" className="mt-0"><GeneralAnalytics /></TabsContent>
        <TabsContent value="ai" className="mt-0"><AiAnalytics /></TabsContent>
      </Tabs>
    </div>
  );
}