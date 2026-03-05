import { useState } from "react";
import { User, Search, Plus, MoreVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listDrivers, createDriver, deleteDriver, type Driver } from "@/lib/api";

export function DriversList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", license_number: "" });
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery<Driver[]>({
    queryKey: ["drivers", searchTerm],
    queryFn: () => listDrivers(searchTerm || undefined),
    staleTime: 15000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDriver(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["drivers"] }); toast({ title: "Водитель удалён" }); setDeleteId(null); },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => createDriver(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["drivers"] }); toast({ title: "Водитель добавлен" }); setShowAdd(false); setForm({ full_name: "", phone: "", license_number: "" }); },
    onError: (e: any) => toast({ title: "Ошибка", description: e?.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Поиск по ФИО..." className="pl-9 bg-white dark:bg-card" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <Sheet open={showAdd} onOpenChange={setShowAdd}>
          <SheetTrigger asChild><Button size="icon" className="shrink-0 bg-[#00b3f2] hover:bg-[#009bd1]"><Plus className="w-5 h-5" /></Button></SheetTrigger>
          <SheetContent>
            <SheetHeader><SheetTitle>Добавить водителя</SheetTitle></SheetHeader>
            <div className="mt-6 space-y-4">
              <div className="space-y-1"><Label>ФИО</Label><Input placeholder="Иванов Иван Иванович" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Телефон</Label><Input placeholder="+7..." value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Номер вод. удостоверения</Label><Input placeholder="99 АА 123456" value={form.license_number} onChange={e => setForm(p => ({ ...p, license_number: e.target.value }))} /></div>
              <Button className="w-full bg-[#00b3f2] hover:bg-[#009bd1]" disabled={createMutation.isPending || !form.full_name}
                onClick={() => createMutation.mutate(form)}>
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
            <EmptyState title="Водители не найдены" description="Добавьте первого водителя" icon={User} />
          ) : (
            items.map(item => (
              <Card key={item.id} className="p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 text-green-600"><User className="w-5 h-5" /></div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm">{item.full_name}</h3>
                  {item.phone && <p className="text-xs text-muted-foreground mt-0.5">{item.phone}</p>}
                  {item.license_number && <p className="text-xs text-muted-foreground">Вод. уд.: {item.license_number}</p>}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(item.id)}>Удалить</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </Card>
            ))
          )}
        </div>
      )}
      <ConfirmDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}
        title="Удалить водителя?" description="Паспортные данные будут удалены без возможности восстановления."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} variant="destructive" actionLabel="Удалить" />
    </div>
  );
}