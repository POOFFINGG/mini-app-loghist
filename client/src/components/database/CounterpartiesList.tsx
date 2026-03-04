import { useState } from "react";
import { 
  Building2, 
  Search, 
  Plus, 
  MoreVertical, 
  FileText, 
  History, 
  Sparkles,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";

const initialCounterparties = [
  {
    id: 1,
    name: "ООО «Логистик Групп»",
    type: "ООО",
    inn: "7701234567",
    kpp: "770101001",
    address: "г. Москва, ул. Лесная, д. 5",
    phone: "+7 (495) 123-45-67",
    email: "info@log-group.ru",
    docsCount: 12,
    requestsCount: 45
  },
  {
    id: 2,
    name: "ИП Петров А.А.",
    type: "ИП",
    inn: "502401234567",
    address: "г. Подольск, ул. Кирова, д. 12",
    phone: "+7 (903) 987-65-43",
    email: "petrov.aa@mail.ru",
    docsCount: 5,
    requestsCount: 8
  }
];

export function CounterpartiesList() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [counterparties, setCounterparties] = useState(initialCounterparties);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleAiImport = () => {
    setIsAiLoading(true);
    setTimeout(() => {
      setIsAiLoading(false);
      toast({
        title: "Реквизиты распознаны",
        description: "Контрагент успешно добавлен из текста",
      });
    }, 2000);
  };

  const handleDelete = () => {
    if (deleteId) {
      setCounterparties(prev => prev.filter(c => c.id !== deleteId));
      setDeleteId(null);
      toast({ title: "Контрагент удален" });
    }
  };

  const filteredItems = counterparties.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.inn.includes(searchTerm)
  );

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Поиск по ИНН, названию..." 
            className="pl-9 bg-white dark:bg-card"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0 text-primary border-primary/20 bg-primary/5">
              <Sparkles className="w-4 h-4" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Импорт реквизитов (ИИ)</SheetTitle>
              <SheetDescription>
                Вставьте текст с реквизитами компании, и ИИ автоматически создаст карточку контрагента.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <textarea 
                className="w-full h-48 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Вставьте текст реквизитов здесь..."
              />
              <Button onClick={handleAiImport} className="w-full bg-[#00b3f2] hover:bg-[#009bd1]" disabled={isAiLoading}>
                {isAiLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Распознавание...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Распознать и создать
                  </>
                )}
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        <Button size="icon" className="shrink-0 bg-[#00b3f2] hover:bg-[#009bd1]">
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* List */}
      <div className="grid gap-3">
        {filteredItems.length === 0 ? (
          <EmptyState 
            title="Контрагенты не найдены" 
            description="Попробуйте изменить поиск или добавьте нового контрагента" 
            icon={Building2}
          />
        ) : (
          filteredItems.map((item) => (
            <Card key={item.id} className="p-4 flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer">
               <div className="flex justify-between items-start">
                 <div className="flex gap-3">
                   <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 text-blue-600">
                     <Building2 className="w-5 h-5" />
                   </div>
                   <div>
                     <h3 className="font-bold text-sm leading-tight">{item.name}</h3>
                     <p className="text-xs text-muted-foreground mt-1">ИНН {item.inn} {item.kpp && `/ КПП ${item.kpp}`}</p>
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
                      <DropdownMenuItem>История переписки</DropdownMenuItem>
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

               <div className="text-xs text-muted-foreground bg-secondary/30 p-2 rounded-lg truncate">
                 {item.address}
               </div>

               <div className="flex gap-4 border-t border-border/50 pt-3">
                  <div className="flex flex-col gap-1">
                     <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                       <FileText className="w-3 h-3" />
                       <span>Документы</span>
                     </div>
                     <span className="text-sm font-bold">{item.docsCount}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                     <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                       <History className="w-3 h-3" />
                       <span>Заявки</span>
                     </div>
                     <span className="text-sm font-bold">{item.requestsCount}</span>
                  </div>
               </div>
            </Card>
          ))
        )}
      </div>

      <ConfirmDialog 
        open={!!deleteId} 
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Удалить контрагента?"
        description="Это действие нельзя отменить. Все связанные данные будут потеряны."
        onConfirm={handleDelete}
        variant="destructive"
        actionLabel="Удалить"
      />
    </div>
  );
}
