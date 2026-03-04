import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Bot, Mic, Paperclip, Send, Loader2, Sparkles, ScanText, FileText, Check, ChevronDown, ChevronUp, ArrowUp } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FormSection } from "@/components/request/FormSection";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRequestSchema, type CreateRequestValues } from "@/lib/request-validation";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default function CreateRequest() {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<string | null>("general");
  const [aiMessage, setAiMessage] = useState("");
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [showAiChat, setShowAiChat] = useState(true);

  // Form setup
  const form = useForm<CreateRequestValues>({
    resolver: zodResolver(createRequestSchema),
    defaultValues: {
      general: { transportType: "FTL" },
      payment: { vat: true, rate: 0 },
      // Initialize other sections as needed
    }
  });

  // Mock AI Processing
  const handleAiAnalyze = async () => {
    if (!aiMessage.trim()) return;
    
    setIsAiProcessing(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock parsed data injection
    form.setValue("general.transportType", "FTL");
    form.setValue("route.origin.address", "Москва, ул. Ленина 1");
    form.setValue("route.destination.address", "Санкт-Петербург, Невский пр. 100");
    form.setValue("cargo.name", "Стройматериалы");
    form.setValue("cargo.weight", 20000);
    form.setValue("cargo.volume", 82);
    form.setValue("payment.rate", 125000);
    
    setIsAiProcessing(false);
    setAiMessage("");
    toast({
      title: "Данные распознаны",
      description: "Форма заполнена на основе вашего описания",
    });
    setShowAiChat(false); // Collapse chat to show form
  };

  const sections = [
    { id: "general", title: "Общие данные", progress: 60 },
    { id: "counterparty", title: "Контрагент", progress: 0 },
    { id: "route", title: "Маршрут", progress: 40 },
    { id: "cargo", title: "Груз", progress: 80 },
    { id: "transport", title: "Транспорт", progress: 0 },
    { id: "driver", title: "Водитель", progress: 0 },
    { id: "payment", title: "Оплата", progress: 20 },
  ];

  const toggleSection = (id: string) => {
    setActiveSection(activeSection === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center gap-4">
        <Link href="/home">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-lg font-bold flex-1">Новая заявка</h1>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn("text-primary", showAiChat && "bg-primary/10")}
          onClick={() => setShowAiChat(!showAiChat)}
        >
          <Bot className="w-5 h-5 mr-2" />
          ИИ
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* AI Assistant Section - Collapsible */}
        <AnimatePresence>
          {showAiChat && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-card border-b border-border/50 overflow-hidden relative"
            >
              {/* Subtle background gradient for depth */}
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
              
              <div className="px-4 py-8 flex flex-col items-center relative z-10">
                <h2 className="text-2xl font-semibold mb-8 text-foreground/90 text-center">Чем могу помочь?</h2>
                
                {/* Suggestion Chips */}
                <div className="w-full max-w-md flex flex-col gap-3 mb-8">
                  <button 
                    type="button"
                    className="bg-secondary/40 hover:bg-secondary/70 text-left p-4 rounded-3xl transition-all duration-200 text-sm flex items-center gap-4 group border border-transparent hover:border-border/50 shadow-sm hover:shadow-md" 
                    onClick={() => setAiMessage("Нужно перевезти 20т труб из Челябинска в Екатеринбург завтра")}
                  >
                    <div className="bg-background/80 group-hover:bg-background p-2.5 rounded-full shadow-sm transition-colors">
                      <FileText className="w-5 h-5 text-primary/70" />
                    </div>
                    <div>
                      <span className="block font-medium text-foreground">Создать заявку из текста</span>
                      <span className="block text-xs text-muted-foreground mt-0.5">Вставьте текст переписки</span>
                    </div>
                  </button>
                  <button type="button" className="bg-secondary/40 hover:bg-secondary/70 text-left p-4 rounded-3xl transition-all duration-200 text-sm flex items-center gap-4 group border border-transparent hover:border-border/50 shadow-sm hover:shadow-md">
                    <div className="bg-background/80 group-hover:bg-background p-2.5 rounded-full shadow-sm transition-colors">
                      <ScanText className="w-5 h-5 text-primary/70" />
                    </div>
                    <div>
                      <span className="block font-medium text-foreground">Распознать документ</span>
                      <span className="block text-xs text-muted-foreground mt-0.5">Загрузите фото заявки</span>
                    </div>
                  </button>
                </div>

                {/* Minimalist Input Bar */}
                <div className="w-full max-w-md relative bg-secondary/30 rounded-[28px] flex items-center p-1.5 border border-border/50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:bg-secondary/50 focus-within:border-primary/30 transition-all shadow-sm">
                  <Button variant="ghost" size="icon" type="button" className="h-10 w-10 text-muted-foreground/70 hover:text-foreground shrink-0 rounded-full hover:bg-secondary/80">
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  
                  <input
                    type="text"
                    placeholder="Спросите что-нибудь..."
                    className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-[15px] px-2 min-h-[44px] placeholder:text-muted-foreground/60 w-full"
                    value={aiMessage}
                    onChange={(e) => setAiMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAiAnalyze();
                    }}
                  />
                  
                  {aiMessage.trim() ? (
                    <Button 
                      size="icon" 
                      type="button"
                      onClick={handleAiAnalyze}
                      disabled={isAiProcessing}
                      className="h-10 w-10 shrink-0 rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-transform active:scale-95"
                    >
                      {isAiProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUp className="w-5 h-5" />}
                    </Button>
                  ) : (
                    <Button variant="ghost" size="icon" type="button" className="h-10 w-10 text-muted-foreground/70 hover:text-foreground shrink-0 rounded-full hover:bg-secondary/80">
                      <Mic className="w-5 h-5" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Sections */}
        <div className="p-4 space-y-3">
          <Form {...form}>
            <form className="space-y-3">
              
              {/* 1. General Data */}
              <FormSection 
                title="Общие данные" 
                isCompleted={false} 
                isActive={activeSection === "general"} 
                progress={60}
                onClick={() => toggleSection("general")}
              >
                 <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="general.transportType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Тип перевозки</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Выберите тип" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="FTL">FTL (Полная загрузка)</SelectItem>
                              <SelectItem value="LTL">LTL (Сборный груз)</SelectItem>
                              <SelectItem value="Combined">Догруз</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 gap-4">
                       <FormField
                         control={form.control}
                         name="general.senderContact"
                         render={({ field }) => (
                           <FormItem>
                             <FormLabel>Контакт отправителя</FormLabel>
                             <FormControl>
                               <Input placeholder="Иванов И.И. +7..." {...field} />
                             </FormControl>
                             <FormMessage />
                           </FormItem>
                         )}
                       />
                       <FormField
                         control={form.control}
                         name="general.receiverContact"
                         render={({ field }) => (
                           <FormItem>
                             <FormLabel>Контакт получателя</FormLabel>
                             <FormControl>
                               <Input placeholder="Петров П.П. +7..." {...field} />
                             </FormControl>
                             <FormMessage />
                           </FormItem>
                         )}
                       />
                    </div>
                 </div>
              </FormSection>

              {/* 2. Route */}
              <FormSection 
                title="Маршрут" 
                isCompleted={false} 
                isActive={activeSection === "route"} 
                progress={40}
                onClick={() => toggleSection("route")}
              >
                  <div className="space-y-6 relative">
                     {/* Timeline connector */}
                     <div className="absolute left-[11px] top-8 bottom-8 w-0.5 bg-border -z-10" />

                     {/* Origin */}
                     <div className="space-y-3">
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 border-2 border-blue-500 z-10" />
                           <h4 className="font-bold text-sm">Пункт загрузки (А)</h4>
                        </div>
                        <div className="pl-8 space-y-3">
                           <FormField
                             control={form.control}
                             name="route.origin.address"
                             render={({ field }) => (
                               <FormItem>
                                 <FormLabel className="text-xs">Адрес</FormLabel>
                                 <FormControl>
                                   <Input placeholder="Город, улица, дом" {...field} />
                                 </FormControl>
                               </FormItem>
                             )}
                           />
                           <div className="flex gap-2">
                              <FormField
                                control={form.control}
                                name="route.origin.date"
                                render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button variant={"outline"} className="w-full pl-3 text-left font-normal text-muted-foreground h-9">
                                          {field.value ? format(field.value, "P", { locale: ru }) : <span>Дата</span>}
                                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                      </PopoverContent>
                                    </Popover>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="route.origin.time"
                                render={({ field }) => (
                                  <FormItem className="w-24">
                                    <FormControl>
                                      <Input type="time" {...field} className="h-9" />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                           </div>
                        </div>
                     </div>

                     {/* Destination */}
                     <div className="space-y-3">
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded-full bg-white dark:bg-card border-2 border-primary z-10" />
                           <h4 className="font-bold text-sm">Пункт выгрузки (Б)</h4>
                        </div>
                        <div className="pl-8 space-y-3">
                           <FormField
                             control={form.control}
                             name="route.destination.address"
                             render={({ field }) => (
                               <FormItem>
                                 <FormLabel className="text-xs">Адрес</FormLabel>
                                 <FormControl>
                                   <Input placeholder="Город, улица, дом" {...field} />
                                 </FormControl>
                               </FormItem>
                             )}
                           />
                           {/* Similar date/time fields for destination */}
                        </div>
                     </div>
                  </div>
              </FormSection>

              {/* 3. Cargo */}
              <FormSection 
                title="Груз" 
                isCompleted={true} 
                isActive={activeSection === "cargo"} 
                progress={100}
                onClick={() => toggleSection("cargo")}
              >
                  <div className="space-y-4">
                     <FormField
                       control={form.control}
                       name="cargo.name"
                       render={({ field }) => (
                         <FormItem>
                           <FormLabel>Наименование груза</FormLabel>
                           <FormControl>
                             <Input placeholder="Например: Трубы металлические" {...field} />
                           </FormControl>
                         </FormItem>
                       )}
                     />
                     <div className="grid grid-cols-3 gap-2">
                        <FormField
                           control={form.control}
                           name="cargo.weight"
                           render={({ field }) => (
                             <FormItem>
                               <FormLabel className="text-xs">Вес (кг)</FormLabel>
                               <FormControl>
                                 <Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} />
                               </FormControl>
                             </FormItem>
                           )}
                         />
                         <FormField
                           control={form.control}
                           name="cargo.volume"
                           render={({ field }) => (
                             <FormItem>
                               <FormLabel className="text-xs">Объем (м³)</FormLabel>
                               <FormControl>
                                 <Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} />
                               </FormControl>
                             </FormItem>
                           )}
                         />
                         <FormField
                           control={form.control}
                           name="cargo.quantity"
                           render={({ field }) => (
                             <FormItem>
                               <FormLabel className="text-xs">Мест</FormLabel>
                               <FormControl>
                                 <Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} />
                               </FormControl>
                             </FormItem>
                           )}
                         />
                     </div>
                  </div>
              </FormSection>

              {/* Other sections would follow similar pattern... */}
              
              <FormSection 
                title="Оплата" 
                isCompleted={false} 
                isActive={activeSection === "payment"} 
                progress={20}
                onClick={() => toggleSection("payment")}
              >
                  <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <FormField
                           control={form.control}
                           name="payment.rate"
                           render={({ field }) => (
                             <FormItem>
                               <FormLabel>Ставка</FormLabel>
                               <FormControl>
                                 <Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} className="font-bold text-lg" />
                               </FormControl>
                             </FormItem>
                           )}
                         />
                         <FormField
                           control={form.control}
                           name="payment.vat"
                           render={({ field }) => (
                             <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-6">
                               <div className="space-y-0.5">
                                 <FormLabel className="text-sm">С НДС</FormLabel>
                               </div>
                               <FormControl>
                                 <Switch
                                   checked={field.value}
                                   onCheckedChange={field.onChange}
                                 />
                               </FormControl>
                             </FormItem>
                           )}
                         />
                     </div>
                  </div>
              </FormSection>

            </form>
          </Form>
        </div>
      </div>
      
      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border/50 z-20">
         <div className="max-w-md mx-auto flex gap-3">
            <Button variant="outline" className="flex-1">
              Сохранить черновик
            </Button>
            <Button className="flex-1 bg-[#00b3f2] hover:bg-[#009bd1]">
              Создать заявку
            </Button>
         </div>
      </div>
    </div>
  );
}
