import { useState } from "react";
import { Truck, Plus, MoreVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listVehicles, createVehicle, deleteVehicle, type Vehicle } from "@/lib/api";

export function VehiclesList() {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ brand: "", truck_plate: "", trailer_plate: "", type: "" });
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery<Vehicle[]>({
    queryKey: ["vehicles"],
    queryFn: () => listVehicles(),
    staleTime: 15000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteVehicle(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vehicles"] }); toast({ title: "ТС удалено" }); setDeleteId(null); },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => createVehicle(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vehicles"] }); toast({ title: "ТС добавлено" }); setShowAdd(false); setForm({ brand: "", truck_plate: "", trailer_plate: "", type: "" }); },
    onError: (e: any) => toast({ title: "Ошибка", description: e?.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Sheet open={showAdd} onOpenChange={setShowAdd}>
          <SheetTrigger asChild><Button size="icon" className="bg-[#00b3f2] hover:bg-[#009bd1]"><Plus className="w-5 h-5" /></Button></SheetTrigger>
          <SheetContent>
            <SheetHeader><SheetTitle>Добавить транспортное средство</SheetTitle></SheetHeader>
            <div className="mt-6 space-y-4">
              <div className="space-y-1"><Label>Марка</Label><Input placeholder="Volvo FH..." value={form.brand} onChange={e => setForm(p => ({ ...p, brand: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Тип ТС</Label><Input placeholder="Тент, Реф, Борт..." value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Гос. номер тягача</Label><Input placeholder="А 123 АА 77" value={form.truck_plate} onChange={e => setForm(p => ({ ...p, truck_plate: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Гос. номер прицепа</Label><Input placeholder="АВ 1234 77" value={form.trailer_plate} onChange={e => setForm(p => ({ ...p, trailer_plate: e.target.value }))} /></div>
              <Button className="w-full bg-[#00b3f2] hover:bg-[#009bd1]" disabled={createMutation.isPending || !form.truck_plate}
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
            <EmptyState title="ТС не найдены" description="Добавьте первое транспортное средство" icon={Truck} />
          ) : (
            items.map(item => (
              <Card key={item.id} className="p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0 text-orange-600"><Truck className="w-5 h-5" /></div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm">{item.brand ?? item.truck_plate}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs bg-secondary px-2 py-0.5 rounded font-mono">{item.truck_plate}</span>
                    {item.trailer_plate && <span className="text-xs bg-secondary px-2 py-0.5 rounded font-mono">{item.trailer_plate}</span>}
                  </div>
                  {item.type && <p className="text-xs text-muted-foreground mt-0.5">{item.type}</p>}
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
        title="Удалить ТС?" description="Транспортное средство будет удалено."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} variant="destructive" actionLabel="Удалить" />
    </div>
  );
}