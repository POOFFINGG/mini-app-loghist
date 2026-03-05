import { useState } from "react";
import { Building2, Search, Plus, MoreVertical, FileText, History, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listCounterparties, createCounterparty, deleteCounterparty, aiParseText, type Counterparty } from "@/lib/api";
import { Label } from "@/components/ui/label";

export function CounterpartiesList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [aiText, setAiText] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", inn: "", kpp: "", legal_address: "", contact_phone: "", contact_email: "" });
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery<Counterparty[]>({
    queryKey: ["counterparties", searchTerm],
    queryFn: () => listCounterparties(searchTerm || undefined),
    staleTime: 15000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCounterparty(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["counterparties"] }); toast({ title: "Контрагент удалён" }); setDeleteId(null); },
    onError: (e: any) => toast({ title: "Ошибка", description: e?.message, variant: "destructive" }),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => createCounterparty(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["counterparties"] }); toast({ title: "Контрагент добавлен" }); setShowAdd(false); setNewForm({ name: "", inn: "", kpp: "", legal_address: "", contact_phone: "", contact_email: "" }); },
    onError: (e: any) => toast({ title: "Ошибка", description: e?.message, variant: "destructive" }),
  });

  const handleAiImport = async () => {
    if (!aiText.trim()) return;
    setIsAiLoading(true);
    try {
      const parsed = await aiParseText("Извлеки реквизиты контрагента: " + aiText);
      const cp = (parsed as any).counterparty ?? parsed;
      await createMutation.mutateAsync({ name: cp.name ?? cp.company_name ?? "Новый контрагент", inn: cp.inn ?? "", kpp: cp.kpp, legal_address: cp.legal_address ?? cp.address, contact_phone: cp.contact_phone ?? cp.phone, contact_email: cp.contact_email ?? cp.email });
      toast({ title: "Контрагент создан из текста" });
      setAiText("");
    } catch (e: any) {
      toast({ title: "Ошибка ИИ", description: e?.message, variant: "destructive" });
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Поиск по ИНН, названию..." className="pl-9 bg-white dark:bg-card" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0 text-primary border-primary/20 bg-primary/5"><Sparkles className="w-4 h-4" /></Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader><SheetTitle>Импорт реквизитов (ИИ)</SheetTitle><SheetDescription>Вставьте текст с реквизитами компании</SheetDescription></SheetHeader>
            <div className="mt-6 space-y-4">
              <textarea className="w-full h-48 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="ООО Ромашка, ИНН 1234567890, КПП 123456789..."
                value={aiText} onChange={e => setAiText(e.target.value)} />
              <Button onClick={handleAiImport} className="w-full bg-[#00b3f2] hover:bg-[#009bd1]" disabled={isAiLoading}>
                {isAiLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Распознавание...</> : <><Sparkles className="w-4 h-4 mr-2" />Распознать и создать</>}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        <Sheet open={showAdd} onOpenChange={setShowAdd}>
          <SheetTrigger asChild>
            <Button size="icon" className="shrink-0 bg-[#00b3f2] hover:bg-[#009bd1]"><Plus className="w-5 h-5" /></Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader><SheetTitle>Добавить контрагента</SheetTitle></SheetHeader>
            <div className="mt-6 space-y-4">
              {[
                { key: "name", label: "Название", placeholder: "ООО Ромашка" },
                { key: "inn", label: "ИНН", placeholder: "1234567890" },
                { key: "kpp", label: "КПП", placeholder: "123456789" },
                { key: "legal_address", label: "Юр. адрес", placeholder: "г. Москва..." },
                { key: "contact_phone", label: "Телефон", placeholder: "+7..." },
                { key: "contact_email", label: "Email", placeholder: "info@..." },
              ].map(f => (
                <div key={f.key} className="space-y-1">
                  <Label>{f.label}</Label>
                  <Input placeholder={f.placeholder} value={(newForm as any)[f.key]} onChange={e => setNewForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
                </div>
              ))}
              <Button className="w-full bg-[#00b3f2] hover:bg-[#009bd1]" disabled={createMutation.isPending || !newForm.name || !newForm.inn}
                onClick={() => createMutation.mutate(newForm)}>
                {createMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Сохранение...</> : "Добавить"}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid gap-3">
          {items.length === 0 ? (
            <EmptyState title="Контрагенты не найдены" description="Добавьте первого контрагента" icon={Building2} />
          ) : (
            items.map((item) => (
              <Card key={item.id} className="p-4 flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 text-blue-600"><Building2 className="w-5 h-5" /></div>
                    <div>
                      <h3 className="font-bold text-sm leading-tight">{item.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">ИНН {item.inn}{item.kpp && " / КПП " + item.kpp}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 -mr-2"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(item.id)}>Удалить</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {item.legal_address && <div className="text-xs text-muted-foreground bg-secondary/30 p-2 rounded-lg truncate">{item.legal_address}</div>}
              </Card>
            ))
          )}
        </div>
      )}

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}
        title="Удалить контрагента?" description="Это действие нельзя отменить."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} variant="destructive" actionLabel="Удалить" />
    </div>
  );
}