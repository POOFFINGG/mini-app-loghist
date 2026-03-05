import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Bot, Paperclip, Loader2, ScanText, FileText, ArrowUp } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { aiParseText, aiParseImage, createRequest, updateRequest, type LogisticsRequest } from "@/lib/api";
import { useEffect, useRef } from "react";

export default function CreateRequest() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState<string | null>("general");
  const [aiMessage, setAiMessage] = useState("");
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [showAiChat, setShowAiChat] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const prefillApplied = useRef(false);
  const qc = useQueryClient();

  const form = useForm<CreateRequestValues>({
    resolver: zodResolver(createRequestSchema),
    defaultValues: {
      general: { transportType: "FTL" },
      payment: { vat: true, rate: 0 },
    }
  });

  // Apply pre-fill data from clone/edit
  useEffect(() => {
    if (prefillApplied.current) return;
    const raw = sessionStorage.getItem("create_request_prefill");
    if (!raw) return;
    sessionStorage.removeItem("create_request_prefill");
    prefillApplied.current = true;
    try {
      const { mode, id, data } = JSON.parse(raw) as { mode: string; id?: string; data: LogisticsRequest };
      if (mode === "edit" && id) setEditId(id);
      applyFromRequest(data);
    } catch {}
  }, []);

  function applyFromRequest(r: LogisticsRequest) {
    if (r.transport_type) form.setValue("general.transportType", r.transport_type as any);
    if (r.origin?.address) form.setValue("route.origin.address", r.origin.address);
    if (r.origin?.time) form.setValue("route.origin.time", r.origin.time);
    if (r.destination?.address) form.setValue("route.destination.address", r.destination.address);
    if (r.destination?.time) form.setValue("route.destination.time", r.destination.time);
    if (r.cargo?.name) form.setValue("cargo.name", r.cargo.name);
    if (r.cargo?.weight_kg) form.setValue("cargo.weight", r.cargo.weight_kg);
    if (r.cargo?.volume_m3) form.setValue("cargo.volume", r.cargo.volume_m3);
    if (r.cargo?.quantity) form.setValue("cargo.quantity", r.cargo.quantity);
    if (r.payment?.rate) form.setValue("payment.rate", r.payment.rate);
    if (r.payment?.vat_included !== undefined) form.setValue("payment.vat", r.payment.vat_included);
    if (r.payment?.payment_terms) form.setValue("payment.terms", r.payment.payment_terms);
    if (r.driver?.full_name) form.setValue("driver.fullName", r.driver.full_name);
    if (r.driver?.phone) form.setValue("driver.phone", r.driver.phone);
    if (r.transport?.truck_plate) form.setValue("transport.plateTractor", r.transport.truck_plate);
    if (r.transport?.trailer_plate) form.setValue("transport.plateTrailer", r.transport.trailer_plate);
    if (r.transport?.brand) form.setValue("transport.brand", r.transport.brand);
  }

  const buildPayload = (data: CreateRequestValues) => ({
    transport_type: data.general?.transportType as any,
    comments: data.general?.comment,
    origin: { address: data.route?.origin?.address, contact_name: data.general?.senderContact, date: data.route?.origin?.date?.toISOString().split("T")[0], time: data.route?.origin?.time },
    destination: { address: data.route?.destination?.address, contact_name: data.general?.receiverContact, date: data.route?.destination?.date?.toISOString().split("T")[0], time: data.route?.destination?.time },
    cargo: { name: data.cargo?.name, weight_kg: data.cargo?.weight, volume_m3: data.cargo?.volume, quantity: data.cargo?.quantity },
    transport: { truck_plate: data.transport?.plateTractor, trailer_plate: data.transport?.plateTrailer, brand: data.transport?.brand },
    driver: { full_name: data.driver?.fullName, phone: data.driver?.phone },
    payment: { rate: data.payment?.rate, vat_included: data.payment?.vat, payment_terms: data.payment?.terms },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateRequestValues) =>
      editId ? updateRequest(editId, buildPayload(data)) : createRequest(buildPayload(data)),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ["requests"] });
      toast({ title: editId ? "Заявка обновлена" : "Заявка создана", description: "Заявка " + (created.request_number ?? created.id) + (editId ? " обновлена" : " создана") });
      setLocation("/requests/" + encodeURIComponent(created.id));
    },
    onError: (e: any) => {
      toast({ title: "Ошибка", description: e?.message || "Не удалось создать заявку", variant: "destructive" });
    },
  });

  const handleAiAnalyze = async () => {
    if (!aiMessage.trim()) return;
    setIsAiProcessing(true);
    try {
      const parsed = await aiParseText(aiMessage);
      applyParsed(parsed);
      setAiMessage("");
      toast({ title: "Данные распознаны", description: "Форма заполнена на основе вашего описания" });
      setShowAiChat(false);
    } catch (e: any) {
      toast({ title: "Ошибка ИИ", description: e?.message || "Не удалось распознать текст", variant: "destructive" });
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsAiProcessing(true);
    try {
      const parsed = await aiParseImage(file);
      applyParsed(parsed);
      toast({ title: "Документ распознан", description: "Форма заполнена из документа" });
      setShowAiChat(false);
    } catch (e: any) {
      toast({ title: "Ошибка OCR", description: e?.message || "Не удалось распознать документ", variant: "destructive" });
    } finally {
      setIsAiProcessing(false);
      e.target.value = "";
    }
  };

  function applyParsed(p: any) {
    if (p.transport_type) form.setValue("general.transportType", p.transport_type);
    if (p.route?.origin?.address) form.setValue("route.origin.address", p.route.origin.address);
    if (p.route?.destination?.address) form.setValue("route.destination.address", p.route.destination.address);
    if (p.cargo?.name) form.setValue("cargo.name", p.cargo.name);
    if (p.cargo?.weight) form.setValue("cargo.weight", p.cargo.weight);
    if (p.cargo?.volume) form.setValue("cargo.volume", p.cargo.volume);
    if (p.payment?.rate) form.setValue("payment.rate", p.payment.rate);
    if (p.driver?.full_name) form.setValue("driver.fullName", p.driver.full_name);
    if (p.driver?.phone) form.setValue("driver.phone", p.driver.phone);
    if (p.transport?.plate_tractor) form.setValue("transport.plateTractor", p.transport.plate_tractor);
  }

  const toggleSection = (id: string) => setActiveSection(activeSection === id ? null : id);

  const watched = form.watch();

  function pct(filled: number, total: number) { return Math.round((filled / total) * 100); }
  function has(v: any) { return v !== undefined && v !== null && v !== "" && v !== 0; }

  const progressGeneral = pct(
    [watched.general?.transportType, watched.general?.senderContact, watched.general?.receiverContact].filter(has).length, 3
  );
  const progressRoute = pct(
    [watched.route?.origin?.address, watched.route?.destination?.address, watched.route?.origin?.date, watched.route?.destination?.date].filter(has).length, 4
  );
  const progressCargo = pct(
    [watched.cargo?.name, watched.cargo?.weight, watched.cargo?.volume, watched.cargo?.quantity].filter(has).length, 4
  );
  const progressTransport = pct(
    [watched.transport?.plateTractor, watched.transport?.brand, watched.driver?.fullName, watched.driver?.phone].filter(has).length, 4
  );
  const progressPayment = pct(
    [watched.payment?.rate, watched.payment?.terms].filter(has).length, 2
  );

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center gap-4">
        <Link href="/home"><Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <h1 className="text-lg font-bold flex-1">{editId ? "Редактирование заявки" : "Новая заявка"}</h1>
        <Button variant="ghost" size="sm" className={cn("text-primary", showAiChat && "bg-primary/10")} onClick={() => setShowAiChat(!showAiChat)}>
          <Bot className="w-5 h-5 mr-2" />ИИ
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {showAiChat && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="bg-card border-b border-border/50 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
              <div className="px-4 py-8 flex flex-col items-center relative z-10">
                <h2 className="text-2xl font-semibold mb-8 text-foreground/90 text-center">Чем могу помочь?</h2>
                <div className="w-full max-w-md flex flex-col gap-3 mb-8">
                  <button type="button"
                    className="bg-secondary/40 hover:bg-secondary/70 text-left p-4 rounded-3xl transition-all text-sm flex items-center gap-4 group border border-transparent hover:border-border/50 shadow-sm"
                    onClick={() => setAiMessage("Нужно перевезти 20т труб из Челябинска в Екатеринбург завтра")}>
                    <div className="bg-background/80 group-hover:bg-background p-2.5 rounded-full shadow-sm"><FileText className="w-5 h-5 text-primary/70" /></div>
                    <div>
                      <span className="block font-medium text-foreground">Создать заявку из текста</span>
                      <span className="block text-xs text-muted-foreground mt-0.5">Вставьте текст переписки</span>
                    </div>
                  </button>
                  <label className="bg-secondary/40 hover:bg-secondary/70 text-left p-4 rounded-3xl transition-all text-sm flex items-center gap-4 group border border-transparent hover:border-border/50 shadow-sm cursor-pointer">
                    <div className="bg-background/80 group-hover:bg-background p-2.5 rounded-full shadow-sm"><ScanText className="w-5 h-5 text-primary/70" /></div>
                    <div>
                      <span className="block font-medium text-foreground">Распознать документ</span>
                      <span className="block text-xs text-muted-foreground mt-0.5">Загрузите фото заявки</span>
                    </div>
                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
                <div className="w-full max-w-md relative bg-secondary/30 rounded-[28px] flex items-center p-1.5 border border-border/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-sm">
                  <label className="h-10 w-10 flex items-center justify-center text-muted-foreground/70 hover:text-foreground shrink-0 rounded-full cursor-pointer hover:bg-secondary/80">
                    <Paperclip className="w-5 h-5" />
                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileUpload} />
                  </label>
                  <input type="text" placeholder="Спросите что-нибудь..."
                    className="flex-1 bg-transparent border-0 focus:outline-none text-[15px] px-2 min-h-[44px] placeholder:text-muted-foreground/60"
                    value={aiMessage} onChange={(e) => setAiMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAiAnalyze(); }} />
                  {aiMessage.trim() && (
                    <Button size="icon" type="button" onClick={handleAiAnalyze} disabled={isAiProcessing}
                      className="h-10 w-10 shrink-0 rounded-full bg-primary text-primary-foreground">
                      {isAiProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUp className="w-5 h-5" />}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-4 space-y-3">
          <Form {...form}>
            <form className="space-y-3">
              <FormSection title="Общие данные" isCompleted={progressGeneral === 100} isActive={activeSection === "general"} progress={progressGeneral} onClick={() => toggleSection("general")}>
                <div className="space-y-4">
                  <FormField control={form.control} name="general.transportType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Тип перевозки</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Выберите тип" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="FTL">FTL (Полная загрузка)</SelectItem>
                          <SelectItem value="LTL">LTL (Сборный груз)</SelectItem>
                          <SelectItem value="Combined">Догруз</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="general.senderContact" render={({ field }) => (
                    <FormItem><FormLabel>Контакт отправителя</FormLabel><FormControl><Input placeholder="Иванов И.И. +7..." {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="general.receiverContact" render={({ field }) => (
                    <FormItem><FormLabel>Контакт получателя</FormLabel><FormControl><Input placeholder="Петров П.П. +7..." {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="general.comment" render={({ field }) => (
                    <FormItem><FormLabel>Комментарий</FormLabel><FormControl><Input placeholder="Дополнительная информация..." {...field} /></FormControl></FormItem>
                  )} />
                </div>
              </FormSection>

              <FormSection title="Маршрут" isCompleted={progressRoute === 100} isActive={activeSection === "route"} progress={progressRoute} onClick={() => toggleSection("route")}>
                <div className="space-y-6 relative">
                  <div className="absolute left-[11px] top-8 bottom-8 w-0.5 bg-border -z-10" />
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 border-2 border-blue-500 z-10" />
                      <h4 className="font-bold text-sm">Пункт загрузки (А)</h4>
                    </div>
                    <div className="pl-8 space-y-3">
                      <FormField control={form.control} name="route.origin.address" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">Адрес</FormLabel><FormControl><Input placeholder="Город, улица, дом" {...field} /></FormControl></FormItem>
                      )} />
                      <div className="flex gap-2">
                        <FormField control={form.control} name="route.origin.date" render={({ field }) => (
                          <FormItem className="flex-1">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full pl-3 text-left font-normal text-muted-foreground h-9">
                                  {field.value ? format(field.value, "P", { locale: ru }) : <span>Дата</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                              </PopoverContent>
                            </Popover>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="route.origin.time" render={({ field }) => (
                          <FormItem className="w-24"><FormControl><Input type="time" {...field} className="h-9" /></FormControl></FormItem>
                        )} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-white dark:bg-card border-2 border-primary z-10" />
                      <h4 className="font-bold text-sm">Пункт выгрузки (Б)</h4>
                    </div>
                    <div className="pl-8 space-y-3">
                      <FormField control={form.control} name="route.destination.address" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs">Адрес</FormLabel><FormControl><Input placeholder="Город, улица, дом" {...field} /></FormControl></FormItem>
                      )} />
                      <div className="flex gap-2">
                        <FormField control={form.control} name="route.destination.date" render={({ field }) => (
                          <FormItem className="flex-1">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full pl-3 text-left font-normal text-muted-foreground h-9">
                                  {field.value ? format(field.value, "P", { locale: ru }) : <span>Дата</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                              </PopoverContent>
                            </Popover>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="route.destination.time" render={({ field }) => (
                          <FormItem className="w-24"><FormControl><Input type="time" {...field} className="h-9" /></FormControl></FormItem>
                        )} />
                      </div>
                    </div>
                  </div>
                </div>
              </FormSection>

              <FormSection title="Груз" isCompleted={progressCargo === 100} isActive={activeSection === "cargo"} progress={progressCargo} onClick={() => toggleSection("cargo")}>
                <div className="space-y-4">
                  <FormField control={form.control} name="cargo.name" render={({ field }) => (
                    <FormItem><FormLabel>Наименование</FormLabel><FormControl><Input placeholder="Трубы металлические" {...field} /></FormControl></FormItem>
                  )} />
                  <div className="grid grid-cols-3 gap-2">
                    <FormField control={form.control} name="cargo.weight" render={({ field }) => (
                      <FormItem><FormLabel className="text-xs">Вес (кг)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="cargo.volume" render={({ field }) => (
                      <FormItem><FormLabel className="text-xs">Объем (м³)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="cargo.quantity" render={({ field }) => (
                      <FormItem><FormLabel className="text-xs">Мест</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} /></FormControl></FormItem>
                    )} />
                  </div>
                </div>
              </FormSection>

              <FormSection title="Транспорт и водитель" isCompleted={progressTransport === 100} isActive={activeSection === "transport"} progress={progressTransport} onClick={() => toggleSection("transport")}>
                <div className="space-y-4">
                  <FormField control={form.control} name="transport.brand" render={({ field }) => (
                    <FormItem><FormLabel>Марка ТС</FormLabel><FormControl><Input placeholder="Volvo, Scania..." {...field} /></FormControl></FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-2">
                    <FormField control={form.control} name="transport.plateTractor" render={({ field }) => (
                      <FormItem><FormLabel className="text-xs">Гос. номер тягача</FormLabel><FormControl><Input placeholder="А 123 АА 77" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="transport.plateTrailer" render={({ field }) => (
                      <FormItem><FormLabel className="text-xs">Гос. номер прицепа</FormLabel><FormControl><Input placeholder="АВ 1234 77" {...field} /></FormControl></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="driver.fullName" render={({ field }) => (
                    <FormItem><FormLabel>ФИО водителя</FormLabel><FormControl><Input placeholder="Иванов Иван Иванович" {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="driver.phone" render={({ field }) => (
                    <FormItem><FormLabel>Телефон водителя</FormLabel><FormControl><Input placeholder="+7..." {...field} /></FormControl></FormItem>
                  )} />
                </div>
              </FormSection>

              <FormSection title="Оплата" isCompleted={progressPayment === 100} isActive={activeSection === "payment"} progress={progressPayment} onClick={() => toggleSection("payment")}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="payment.rate" render={({ field }) => (
                      <FormItem><FormLabel>Ставка (₽)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} className="font-bold text-lg" /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="payment.vat" render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-6">
                        <FormLabel className="text-sm">С НДС</FormLabel>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="payment.terms" render={({ field }) => (
                    <FormItem><FormLabel>Условия оплаты</FormLabel><FormControl><Input placeholder="5 б.д. после оригиналов" {...field} /></FormControl></FormItem>
                  )} />
                </div>
              </FormSection>
            </form>
          </Form>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-xl border-t border-border/50 z-20">
        <div className="max-w-md mx-auto flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => toast({ title: "Черновик сохранён" })}>
            Сохранить черновик
          </Button>
          <Button className="flex-1 bg-[#00b3f2] hover:bg-[#009bd1]" disabled={createMutation.isPending}
            onClick={form.handleSubmit(
              (data) => createMutation.mutate(data),
              (errors) => {
                const msgs = Object.values(errors).flatMap(e =>
                  typeof e === "object" && e !== null
                    ? Object.values(e as any).map((v: any) => v?.message).filter(Boolean)
                    : []
                );
                toast({ title: "Заполните обязательные поля", description: msgs.slice(0, 3).join("; ") || "Проверьте форму", variant: "destructive" });
              }
            )}>
            {createMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{editId ? "Сохранение..." : "Создание..."}</> : editId ? "Сохранить изменения" : "Создать заявку"}
          </Button>
        </div>
      </div>
    </div>
  );
}