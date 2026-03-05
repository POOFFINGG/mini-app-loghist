import { motion } from "framer-motion";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, MapPin, Calendar, Clock, Truck, User, CreditCard, FileText, Download, Copy, Edit3, History, MoreVertical, Loader2, RotateCcw, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRequest, updateRequest, deleteRequest, listDocuments, getDocumentDownloadUrl, getRequestHistory, type LogisticsRequest, type RequestHistoryEntry } from "@/lib/api";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { useState } from "react";

function fmt(d?: string) {
  if (!d) return "—";
  try { return format(parseISO(d), "dd.MM.yyyy"); } catch { return d; }
}

function fmtDateTime(d?: string) {
  if (!d) return "—";
  try { return format(parseISO(d), "dd.MM.yyyy HH:mm", { locale: ru }); } catch { return d; }
}

const statusColor: Record<string, string> = {
  "В пути": "#00b3f2",
  "Подтверждена": "#22c55e",
  "Ожидает оплаты": "#ef4444",
  "Требуется прикрепить документ": "#f97316",
  "Требуется подтверждение": "#94a3b8",
  "Оплачена": "#22c55e",
  "В архив": "#64748b",
  // English statuses (backend)
  pending: "#94a3b8",
  confirmed: "#22c55e",
  in_transit: "#00b3f2",
  delivered: "#f97316",
  awaiting_payment: "#ef4444",
  paid: "#22c55e",
  archived: "#64748b",
};

const progressMap: Record<string, number> = {
  "Требуется подтверждение": 10, "Подтверждена": 30, "В пути": 65,
  "Требуется прикрепить документ": 90, "Ожидает оплаты": 95, "Оплачена": 100, "В архив": 100,
  pending: 10, confirmed: 30, in_transit: 65,
  delivered: 90, awaiting_payment: 95, paid: 100, archived: 100,
};

// Status chain for rollback (English backend values)
const STATUS_CHAIN = ["pending", "confirmed", "in_transit", "delivered", "awaiting_payment", "paid"] as const;
type StatusKey = typeof STATUS_CHAIN[number];

const STATUS_LABELS: Record<string, string> = {
  pending: "Требуется подтверждение",
  confirmed: "Подтверждена",
  in_transit: "В пути",
  delivered: "Требуется прикрепить документ",
  awaiting_payment: "Ожидает оплаты",
  paid: "Оплачена",
  archived: "В архив",
  draft: "Черновик",
  cancelled: "Отменена",
};

const AUDIT_ACTION_LABELS: Record<string, string> = {
  "request.created": "Заявка создана",
  "request.updated": "Заявка обновлена",
  "request.deleted": "Заявка удалена",
  "request.archived": "Заявка перемещена в архив",
  "document.uploaded": "Документ загружен",
  "document.downloaded": "Документ скачан",
  "document.deleted": "Документ удалён",
};

function exportPdf(request: LogisticsRequest) {
  const html = buildExportHtml(request);
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.onload = () => { win.print(); };
}

function exportWord(request: LogisticsRequest) {
  const html = buildExportHtml(request);
  const blob = new Blob(["\ufeff" + html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Заявка_${request.request_number}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

function buildExportHtml(r: LogisticsRequest): string {
  const row = (label: string, value?: string | number) =>
    value !== undefined && value !== null && value !== ""
      ? `<tr><td style="padding:6px 12px;color:#666;width:40%">${label}</td><td style="padding:6px 12px;font-weight:600">${value}</td></tr>`
      : "";

  const status = STATUS_LABELS[r.status] ?? r.status;
  const rate = r.payment?.rate ? `${r.payment.rate.toLocaleString("ru-RU")} ₽${r.payment.vat_included ? " (с НДС)" : " (без НДС)"}` : undefined;

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; color: #1a1a1a; margin: 40px; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  h2 { font-size: 15px; color: #555; margin: 24px 0 8px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; }
  td { vertical-align: top; font-size: 14px; }
  .status { display: inline-block; padding: 4px 12px; background: #f0f0f0; border-radius: 20px; font-weight: 600; }
  @media print { @page { margin: 20mm; } }
</style></head><body>
<h1>Заявка ${r.request_number}</h1>
<p class="status">${status}</p>
<h2>Маршрут</h2>
<table>
  ${row("Загрузка", r.origin?.address)}
  ${row("Дата загрузки", r.origin?.date ? fmt(r.origin.date) : undefined)}
  ${row("Выгрузка", r.destination?.address)}
  ${row("Дата выгрузки", r.destination?.date ? fmt(r.destination.date) : undefined)}
</table>
<h2>Груз</h2>
<table>
  ${row("Наименование", r.cargo?.name)}
  ${row("Вес", r.cargo?.weight_kg ? r.cargo.weight_kg + " кг" : undefined)}
  ${row("Объём", r.cargo?.volume_m3 ? r.cargo.volume_m3 + " м³" : undefined)}
  ${row("Количество мест", r.cargo?.quantity ? String(r.cargo.quantity) : undefined)}
</table>
<h2>Транспорт и водитель</h2>
<table>
  ${row("Тягач", r.transport?.truck_plate)}
  ${row("Прицеп", r.transport?.trailer_plate)}
  ${row("Марка", r.transport?.brand)}
  ${row("Водитель", r.driver?.full_name)}
  ${row("Телефон водителя", r.driver?.phone)}
</table>
<h2>Оплата</h2>
<table>
  ${row("Ставка", rate)}
  ${row("Условия", r.payment?.payment_terms)}
</table>
<p style="margin-top:40px;color:#aaa;font-size:12px">Сформировано: ${new Date().toLocaleDateString("ru-RU")} — LogHist</p>
</body></html>`;
}

export default function RequestDetail() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id ?? "");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showHistory, setShowHistory] = useState(false);
  const [showRollback, setShowRollback] = useState(false);
  const [rollbackTarget, setRollbackTarget] = useState<string>("");

  const { data: request, isLoading, error } = useQuery<LogisticsRequest>({
    queryKey: ["request", id],
    queryFn: () => getRequest(id),
    enabled: !!id,
  });

  const { data: docs = [] } = useQuery({
    queryKey: ["documents", id],
    queryFn: () => listDocuments(id),
    enabled: !!id,
  });

  const { data: history = [], isLoading: historyLoading } = useQuery<RequestHistoryEntry[]>({
    queryKey: ["request-history", id],
    queryFn: () => getRequestHistory(id),
    enabled: showHistory && !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteRequest(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["requests"] });
      toast({ title: "Заявка удалена" });
      setLocation("/requests");
    },
  });

  const rollbackMutation = useMutation({
    mutationFn: (targetStatus: string) => updateRequest(id, { status: targetStatus as any }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["request", id] });
      qc.invalidateQueries({ queryKey: ["requests"] });
      qc.invalidateQueries({ queryKey: ["request-history", id] });
      toast({ title: "Статус изменён" });
      setShowRollback(false);
    },
    onError: (e: Error) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const handleClone = () => {
    sessionStorage.setItem("create_request_prefill", JSON.stringify({ mode: "clone", data: request }));
    toast({ title: "Заявка скопирована", description: "Форма заполнена данными текущей заявки" });
    setLocation("/create-request");
  };

  const handleEdit = () => {
    sessionStorage.setItem("create_request_prefill", JSON.stringify({ mode: "edit", id: request!.id, data: request }));
    setLocation("/create-request");
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  if (error || !request) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
      <p className="text-muted-foreground">Заявка не найдена</p>
      <Button onClick={() => setLocation("/requests")}>← Назад</Button>
    </div>
  );

  const color = statusColor[request.status] ?? "#94a3b8";
  const progress = progressMap[request.status] ?? 50;

  // Statuses before the current one in the chain (available for rollback)
  const currentIdx = STATUS_CHAIN.indexOf(request.status as StatusKey);
  const rollbackStatuses = currentIdx > 0 ? STATUS_CHAIN.slice(0, currentIdx) : [];

  return (
    <div className="min-h-screen bg-background flex flex-col pb-24">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary" onClick={() => setLocation("/requests")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">{request.request_number}</h1>
            <span className="text-xs text-muted-foreground">от {fmt(request.created_at)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setShowHistory(true)}>
            <History className="w-5 h-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="w-5 h-5" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                disabled={!["pending", "draft", "Требуется подтверждение"].includes(request.status)}
                onClick={handleEdit}>
                <Edit3 className="w-4 h-4 mr-2" /> Редактировать
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleClone}><Copy className="w-4 h-4 mr-2" /> Клонировать</DropdownMenuItem>
              {rollbackStatuses.length > 0 && (
                <DropdownMenuItem onClick={() => { setRollbackTarget(rollbackStatuses[rollbackStatuses.length - 1]); setShowRollback(true); }}>
                  <RotateCcw className="w-4 h-4 mr-2" /> Откатить статус
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => exportPdf(request)}>
                <FileDown className="w-4 h-4 mr-2" /> Скачать PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportWord(request)}>
                <FileDown className="w-4 h-4 mr-2" /> Скачать Word
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => { if (confirm("Удалить заявку?")) deleteMutation.mutate(); }}>
                Удалить заявку
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="p-4 space-y-6">
        <div className="bg-card border rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl -mr-10 -mt-10" style={{ background: color + "1a" }} />
          <div className="flex justify-between items-center mb-4 relative z-10 gap-3">
            <div className="min-w-0">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Текущий статус</span>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-2 h-2 rounded-full shrink-0 animate-pulse" style={{ background: color }} />
                <h2 className="text-base font-bold leading-tight truncate" style={{ color }}>{STATUS_LABELS[request.status] ?? request.status}</h2>
              </div>
            </div>
            {request.payment?.rate && (
              <div className="text-right shrink-0">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Ставка</span>
                <p className="text-sm font-bold mt-0.5 text-foreground whitespace-nowrap">{request.payment.rate.toLocaleString("ru-RU")} ₽{request.payment.vat_included ? " с НДС" : " без НДС"}</p>
              </div>
            )}
          </div>
          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mb-2">
            <div className="h-full rounded-full transition-all" style={{ width: progress + "%", background: color }} />
          </div>
          {request.payment?.payment_terms && <p className="text-sm font-semibold text-muted-foreground/80 text-left mt-3">Условия: {request.payment.payment_terms}</p>}
        </div>

        {(request.origin || request.destination) && (
          <div className="space-y-4 relative">
            <div className="absolute left-[19px] top-4 bottom-10 w-0.5 bg-border -z-10" />
            {request.origin && (
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 border-4 border-background">
                  <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-bold text-lg leading-none">{request.origin.address?.split(",")[0] ?? "Загрузка"}</h3>
                  <p className="text-[15px] text-muted-foreground mt-1 leading-snug">{request.origin.address}</p>
                  <div className="flex gap-4 mt-2">
                    {request.origin.date && <div className="flex items-center gap-1.5 text-xs font-medium bg-secondary/50 px-2 py-1 rounded-md"><Calendar className="w-3.5 h-3.5 opacity-70" /> {fmt(request.origin.date)}</div>}
                    {request.origin.time && <div className="flex items-center gap-1.5 text-xs font-medium bg-secondary/50 px-2 py-1 rounded-md"><Clock className="w-3.5 h-3.5 opacity-70" /> {request.origin.time}</div>}
                  </div>
                </div>
              </div>
            )}
            {request.destination && (
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 border-4 border-background">
                  <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-bold text-lg leading-none">{request.destination.address?.split(",")[0] ?? "Выгрузка"}</h3>
                  <p className="text-[15px] text-muted-foreground mt-1 leading-snug">{request.destination.address}</p>
                  <div className="flex gap-4 mt-2">
                    {request.destination.date && <div className="flex items-center gap-1.5 text-xs font-medium bg-secondary/50 px-2 py-1 rounded-md"><Calendar className="w-3.5 h-3.5 opacity-70" /> {fmt(request.destination.date)}</div>}
                    {request.destination.time && <div className="flex items-center gap-1.5 text-xs font-medium bg-secondary/50 px-2 py-1 rounded-md"><Clock className="w-3.5 h-3.5 opacity-70" /> {request.destination.time}</div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <Separator />

        <div className="grid grid-cols-1 gap-4">
          {request.cargo?.name && (
            <div className="flex gap-3 items-start">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><FileText className="w-6 h-6 text-primary" /></div>
              <div>
                <h4 className="font-semibold text-[15px]">Груз</h4>
                <p className="text-[15px] text-muted-foreground leading-snug">{request.cargo.name}</p>
                <p className="text-[13px] text-muted-foreground/80 mt-1">
                  {[request.cargo.weight_kg && request.cargo.weight_kg + " кг", request.cargo.volume_m3 && request.cargo.volume_m3 + " м³", request.cargo.quantity && request.cargo.quantity + " мест"].filter(Boolean).join(" • ")}
                </p>
              </div>
            </div>
          )}
          {request.transport?.truck_plate && (
            <div className="flex gap-3 items-start">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Truck className="w-6 h-6 text-primary" /></div>
              <div>
                <h4 className="font-semibold text-[15px]">Транспорт</h4>
                <p className="text-[15px] text-muted-foreground leading-snug">{request.transport.type ?? request.transport.brand ?? "—"}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {request.transport.truck_plate && <Badge variant="outline" className="text-[12px] h-6 px-2.5">{request.transport.truck_plate}</Badge>}
                  {request.transport.trailer_plate && <Badge variant="outline" className="text-[12px] h-6 px-2.5">{request.transport.trailer_plate}</Badge>}
                </div>
              </div>
            </div>
          )}
          {request.driver?.full_name && (
            <div className="flex gap-3 items-start">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><User className="w-6 h-6 text-primary" /></div>
              <div>
                <h4 className="font-semibold text-[15px]">Водитель</h4>
                <p className="text-[15px] text-muted-foreground leading-snug">{request.driver.full_name} {request.driver.phone && "(" + request.driver.phone + ")"}</p>
              </div>
            </div>
          )}
        </div>

        {docs.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h3 className="font-semibold text-[17px]">Документы</h3>
              <div className="grid grid-cols-2 gap-3">
                {docs.map((doc: any) => (
                  <a key={doc.id} href={getDocumentDownloadUrl(doc.id)} target="_blank" rel="noreferrer"
                    className="bg-secondary/30 border rounded-xl p-3 flex items-start justify-between group cursor-pointer hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-white dark:bg-card flex items-center justify-center shadow-sm text-red-500">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[13px] font-semibold truncate max-w-[120px]">{doc.filename}</span>
                        <span className="text-[12px] text-muted-foreground/80">{fmt(doc.created_at)}</span>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                  </a>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── History sheet ── */}
      <Sheet open={showHistory} onOpenChange={setShowHistory}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-[1.5rem] px-0">
          <SheetHeader className="px-5 pb-3 border-b border-border/50">
            <SheetTitle>История заявки</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto h-full px-5 py-4 space-y-0">
            {historyLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : history.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">История пуста</p>
            ) : (
              history.map((entry, i) => (
                <div key={entry._id} className="flex gap-3 pb-5 relative">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full shrink-0 mt-1 ${entry.success ? "bg-primary" : "bg-destructive"}`} />
                    {i < history.length - 1 && <div className="w-0.5 flex-1 bg-border/50 mt-1" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold leading-snug">{AUDIT_ACTION_LABELS[entry.action] ?? entry.action}</p>
                    {entry.details && Object.keys(entry.details).length > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {entry.details.fields ? "Поля: " + (entry.details.fields as string[]).join(", ") :
                         entry.details.number ? `Номер: ${entry.details.number}` : ""}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground/70 mt-1">{fmtDateTime(entry.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Rollback sheet ── */}
      <Sheet open={showRollback} onOpenChange={setShowRollback}>
        <SheetContent side="bottom" className="rounded-t-[1.5rem] pb-10">
          <SheetHeader className="pb-4">
            <SheetTitle>Откат статуса</SheetTitle>
          </SheetHeader>
          <p className="text-sm text-muted-foreground mb-4">Выберите статус, к которому нужно вернуться:</p>
          <Select value={rollbackTarget} onValueChange={setRollbackTarget}>
            <SelectTrigger className="w-full h-12 rounded-xl">
              <SelectValue placeholder="Выберите статус" />
            </SelectTrigger>
            <SelectContent>
              {rollbackStatuses.map(s => (
                <SelectItem key={s} value={s}>{STATUS_LABELS[s] ?? s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            className="w-full mt-4 h-12 rounded-xl"
            disabled={!rollbackTarget || rollbackMutation.isPending}
            onClick={() => rollbackMutation.mutate(rollbackTarget)}
          >
            {rollbackMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RotateCcw className="w-4 h-4 mr-2" />}
            Применить откат
          </Button>
        </SheetContent>
      </Sheet>
    </div>
  );
}
