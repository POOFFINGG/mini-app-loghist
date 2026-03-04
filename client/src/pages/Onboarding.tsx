import { motion } from "framer-motion";
import { useLocation } from "wouter";
import containerImage from "@assets/generated_images/blue_shipping_container_3d.png";
import logo from "@assets/logo.png";

export default function Onboarding() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background container image */}
      <div className="absolute top-0 left-0 right-0 h-[60vh] flex items-center justify-center overflow-visible pointer-events-none">
        <motion.img 
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          src={containerImage} 
          alt="Shipping Container" 
          className="w-[120%] max-w-none object-contain drop-shadow-[0_20px_50px_rgba(0,179,242,0.15)]"
        />
      </div>

      <div className="flex-1" /> {/* Spacer */}

      <div className="p-6 pb-12 z-10 flex flex-col gap-6 bg-gradient-to-t from-background via-background to-transparent pt-32">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <img src={logo} alt="Логист ИИ" className="h-10 w-auto object-contain" />

          <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
            Умная логистика <br />
            <span className="text-[#00b3f2]">с интеллектом</span>
          </h1>

          <p className="text-muted-foreground text-lg leading-relaxed max-w-sm">
            Автоматизация заявок, документов и отчетности в одной платформе.
          </p>
        </motion.div>

        <div className="space-y-3">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={() => setLocation("/auth")}
            className="w-full bg-[#00b3f2] text-white font-bold text-lg py-4 rounded-full hover:bg-[#009bd1] active:scale-95 transition-all shadow-[0_10px_20px_rgba(0,179,242,0.3)] hover:shadow-[0_15px_30px_rgba(0,179,242,0.4)]"
          >
            Войти
          </motion.button>
          
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            onClick={() => setLocation("/register")}
            className="w-full bg-white dark:bg-white/5 text-foreground font-bold text-lg py-4 rounded-full hover:bg-gray-50 dark:hover:bg-white/10 active:scale-95 transition-all border border-border"
          >
            Регистрация
          </motion.button>
        </div>
      </div>
    </div>
  );
}
