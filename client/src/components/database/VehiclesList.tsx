import { useState } from "react";
import { 
  Truck, 
  Search, 
  Plus, 
  MoreVertical, 
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/hooks/use-toast";

const initialVehicles = [
  {
    id: 1,
    type: "Тягач",
    model: "Volvo FH16",
    plate: "А 777 АА 777",
    sts: "77 12 345678",
    pts: "77 12 123456",
    status: "active"
  },
  {
    id: 2,
    type: "Прицеп (Тент)",
    model: "Schmitz Cargobull",
    plate: "ВЕ 1234 77",
    sts: "77 12 876543",
    pts: "77 12 654321",
    status: "active"
  }
];

export function VehiclesList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { toast } = useToast();

  const handleDelete = () => {
    if (deleteId) {
      setVehicles(prev => prev.filter(v => v.id !== deleteId));
      setDeleteId(null);
      toast({ title: "Транспорт удален" });
    }
  };

  const filteredItems = vehicles.filter(item => 
    item.plate.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Поиск по гос. номеру, марке..." 
            className="pl-9 bg-white dark:bg-card"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button size="icon" className="shrink-0 bg-[#00b3f2] hover:bg-[#009bd1]">
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* List */}
      <div className="grid gap-3">
        {filteredItems.length === 0 ? (
          <EmptyState 
            title="Транспорт не найден" 
            description="Попробуйте изменить поиск или добавьте ТС" 
            icon={Truck}
          />
        ) : (
          filteredItems.map((item) => (
            <Card key={item.id} className="p-4 flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer">
               <div className="flex justify-between items-start">
                 <div className="flex gap-3">
                   <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0 text-purple-600">
                     <Truck className="w-5 h-5" />
                   </div>
                   <div>
                     <h3 className="font-bold text-sm leading-tight">{item.model}</h3>
                     <p className="text-xs text-muted-foreground mt-1 font-mono bg-secondary/50 px-1.5 py-0.5 rounded inline-block">
                       {item.plate}
                     </p>
                   </div>
                 </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Редактировать</DropdownMenuItem>
                      <DropdownMenuItem>Документы (СТС/ПТС)</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => setDeleteId(item.id)}
                      >
                        Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
               </div>

               <div className="flex flex-wrap gap-2 text-xs pt-1">
                  <Badge variant="outline" className="font-normal text-muted-foreground">{item.type}</Badge>
                  <div className="flex items-center gap-1 ml-auto text-muted-foreground">
                     <FileText className="w-3 h-3" /> СТС: {item.sts}
                  </div>
               </div>
            </Card>
          ))
        )}
      </div>

      <ConfirmDialog 
        open={!!deleteId} 
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Удалить транспортное средство?"
        description="Это действие нельзя отменить."
        onConfirm={handleDelete}
        variant="destructive"
        actionLabel="Удалить"
      />
    </div>
  );
}
