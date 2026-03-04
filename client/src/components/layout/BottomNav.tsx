import { Link, useLocation } from "wouter";
import { Home, FileText, Database, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { icon: Home, label: "Главная", path: "/home" },
    { icon: FileText, label: "Заявки", path: "/requests" },
    { icon: Database, label: "База", path: "/database" },
    { icon: User, label: "Профиль", path: "/profile" },
  ];

  if (location === "/" || location === "/onboarding" || location === "/auth" || location === "/register") return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[400px] z-50">
      <div className="bg-white/90 dark:bg-[#1A1F2C]/90 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-[2rem] px-4 py-3 flex justify-between items-center relative shadow-sm">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <div className="relative flex flex-col items-center justify-center w-[4.5rem] cursor-pointer group">
                {isActive && (
                   <motion.div
                     layoutId="nav-pill"
                     className="absolute inset-0 bg-primary/10 dark:bg-primary/20 rounded-2xl -z-10"
                     initial={{ opacity: 0, scale: 0.8 }}
                     animate={{ opacity: 1, scale: 1 }}
                     transition={{ type: "spring", stiffness: 300, damping: 30 }}
                   />
                )}
                
                <div className={cn(
                  "relative p-2.5 rounded-xl transition-all duration-300",
                  isActive ? "-translate-y-1" : "group-hover:-translate-y-0.5"
                )}>
                  <item.icon 
                    className={cn(
                      "w-[26px] h-[26px] transition-colors duration-300", 
                      isActive ? "text-primary fill-primary/20" : "text-muted-foreground group-hover:text-foreground"
                    )} 
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                
                {isActive && (
                  <motion.div 
                    layoutId="nav-dot"
                    className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
