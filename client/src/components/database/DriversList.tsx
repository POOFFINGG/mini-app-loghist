import { useState } from "react";
import { 
  User, 
  Search, 
  Plus, 
  MoreVertical, 
  FileCheck, 
  Phone,
  Copy
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

const initialDrivers = [
  {
    id: 1,
    name: "Иванов Иван Иванович",
    phone: "+7 (999) 123-45-67",
    license: "99 12 345678 (CE)",
    passport: "4512 123456",
    status: "active",
    docsValid: true
  },
  {
    id: 2,
    name: "Сидоров Петр Петрович",
    phone: "+7 (999) 765-43-21",
    license: "99 12 876543 (B, C)",
    passport: "4512 654321",
    status: "inactive",
    docsValid: false
  }
];

export function DriversList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [drivers, setDrivers] = useState(initialDrivers);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { toast } = useToast();

  const handleDelete = () => {
    if (deleteId) {
      setDrivers(prev => prev.filter(d => d.id !== deleteId));
      setDeleteId(null);
      toast({ title: "Водитель удален" });
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({ 
      title: "Скопировано",
      description: `${type} скопирован в буфер обмена`
    });
  };

  const filteredItems = drivers.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Поиск по ФИО, телефону..." 
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
            title="Водители не найдены" 
            description="Попробуйте изменить поиск или добавьте нового водителя" 
            icon={User}
          />
        ) : (
          filteredItems.map((item) => (
            <Card key={item.id} className="p-4 flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer">
               <div className="flex justify-between items-start">
                 <div className="flex gap-3">
                   <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                     <User className="w-5 h-5" />
                   </div>
                   <div>
                     <h3 className="font-bold text-sm leading-tight">{item.name}</h3>
                     <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                       <Phone className="w-3 h-3" /> {item.phone}
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
                      <DropdownMenuItem>Документы</DropdownMenuItem>
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

               <div className="flex flex-wrap gap-2 text-xs">
                  <div className="group/badge relative inline-flex">
                    <Badge variant="secondary" className="font-normal text-muted-foreground pr-8">ВУ: {item.license}</Badge>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleCopy(item.license, 'Номер ВУ'); }}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground opacity-0 group-hover/badge:opacity-100 transition-opacity"
                      title="Копировать"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="group/badge relative inline-flex">
                    <Badge variant="secondary" className="font-normal text-muted-foreground pr-8">Паспорт: {item.passport}</Badge>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleCopy(item.passport, 'Номер паспорта'); }}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground opacity-0 group-hover/badge:opacity-100 transition-opacity"
                      title="Копировать"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
               </div>

               <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                     {item.docsValid ? (
                       <span className="text-green-600 flex items-center gap-1">
                         <FileCheck className="w-3 h-3" /> Документы в порядке
                       </span>
                     ) : (
                       <span className="text-red-500 flex items-center gap-1">
                         <FileCheck className="w-3 h-3" /> Истекает срок
                       </span>
                     )}
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-xs rounded-full border-primary/20 hover:bg-primary/5 hover:border-primary/40 text-primary">
                    Загрузить скан
                  </Button>
               </div>
            </Card>
          ))
        )}
      </div>

      <ConfirmDialog 
        open={!!deleteId} 
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Удалить водителя?"
        description="Это действие нельзя отменить."
        onConfirm={handleDelete}
        variant="destructive"
        actionLabel="Удалить"
      />
    </div>
  );
}
