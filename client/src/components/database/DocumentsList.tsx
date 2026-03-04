import { useState } from "react";
import { 
  FileText, 
  Search, 
  Upload, 
  SlidersHorizontal,
  Eye,
  Download,
  Link as LinkIcon,
  Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/hooks/use-toast";

const initialDocs = [
  {
    id: 1,
    name: "ТТН №123.pdf",
    type: "ТТН",
    date: "10.08.2024",
    size: "1.2 MB",
    linkedTo: "Заявка #123",
    status: "signed"
  },
  {
    id: 2,
    name: "Договор ООО Логистик.docx",
    type: "Договор",
    date: "01.08.2024",
    size: "2.4 MB",
    linkedTo: "ООО «Логистик Групп»",
    status: "pending"
  },
  {
    id: 3,
    name: "Акт сверки 2024.pdf",
    type: "Акт",
    date: "15.07.2024",
    size: "0.5 MB",
    linkedTo: "ИП Петров",
    status: "signed"
  }
];

export function DocumentsList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const { toast } = useToast();

  const filteredItems = initialDocs.filter(item => {
    if (filterType !== "all" && item.type !== filterType) return false;
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Поиск документа..." 
            className="pl-9 bg-white dark:bg-card"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem checked={filterType === "all"} onCheckedChange={() => setFilterType("all")}>Все типы</DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked={filterType === "ТТН"} onCheckedChange={() => setFilterType("ТТН")}>ТТН</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={filterType === "Договор"} onCheckedChange={() => setFilterType("Договор")}>Договоры</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={filterType === "Акт"} onCheckedChange={() => setFilterType("Акт")}>Акты</DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button className="shrink-0 bg-primary/10 hover:bg-primary/20 text-primary border-0 gap-2">
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Новая выгрузка</span>
        </Button>
      </div>

      {/* Quick Filters (Tabs style) */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-2 px-2">
        {["Все", "ТТН", "Договоры", "Акты", "Счета"].map((type) => (
          <Badge 
            key={type} 
            variant={filterType === type || (filterType === "all" && type === "Все") ? "default" : "outline"}
            className="cursor-pointer whitespace-nowrap"
            onClick={() => setFilterType(type === "Все" ? "all" : type)}
          >
            {type}
          </Badge>
        ))}
      </div>

      {/* List */}
      <div className="grid gap-4">
        {filteredItems.length === 0 ? (
          <EmptyState 
            title="Документы не найдены" 
            description="Загрузите новые документы или измените фильтры" 
            icon={FileText}
          />
        ) : (
          filteredItems.map((item) => (
            <Card key={item.id} className="p-4 flex items-center justify-between hover:shadow-md transition-all cursor-pointer group border-border/50">
               <div className="flex items-center gap-4 overflow-hidden">
                 <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary shadow-sm">
                   <FileText className="w-6 h-6" />
                 </div>
                 <div className="min-w-0 pr-4">
                   <h3 className="font-semibold text-[15px] leading-tight mb-1.5 whitespace-normal break-words">{item.name}</h3>
                   <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[13px] text-muted-foreground/80">
                     <span>{item.date}</span>
                     {item.linkedTo && (
                       <>
                          <span className="text-border">•</span>
                          <span className="flex items-center gap-1 text-primary/80 bg-primary/5 px-2 py-0.5 rounded-md">
                             <LinkIcon className="w-3 h-3" /> {item.linkedTo}
                          </span>
                       </>
                     )}
                   </div>
                 </div>
               </div>

               <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
                  <Button variant="ghost" size="icon" className="hidden group-hover:flex h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary">
                     <Download className="w-[18px] h-[18px]" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary">
                     <Eye className="w-[18px] h-[18px]" />
                  </Button>
               </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
