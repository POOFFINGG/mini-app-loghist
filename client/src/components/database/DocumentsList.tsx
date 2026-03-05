import { useState } from "react";
import { FileText, Upload, MoreVertical, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listDocuments, uploadDocument, deleteDocument, getDocumentDownloadUrl, type Document } from "@/lib/api";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

function fmt(d?: string) {
  if (!d) return "";
  try { return format(parseISO(d), "dd MMM yyyy", { locale: ru }); } catch { return d; }
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return bytes + " Б";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " КБ";
  return (bytes / (1024 * 1024)).toFixed(1) + " МБ";
}

export function DocumentsList() {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery<Document[]>({
    queryKey: ["documents"],
    queryFn: () => listDocuments(),
    staleTime: 15000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["documents"] }); toast({ title: "Документ удалён" }); setDeleteId(null); },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      await uploadDocument(file, undefined, true);
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast({ title: "Документ загружен", description: file.name });
    } catch (err: any) {
      toast({ title: "Ошибка загрузки", description: err?.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <label>
          <Button asChild className="bg-[#00b3f2] hover:bg-[#009bd1]" disabled={isUploading}>
            <span>
              {isUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Загрузка...</> : <><Upload className="w-4 h-4 mr-2" />Загрузить</>}
            </span>
          </Button>
          <input type="file" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx" className="hidden" onChange={handleUpload} />
        </label>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid gap-3">
          {items.length === 0 ? (
            <EmptyState title="Документов нет" description="Загрузите первый документ" icon={FileText} />
          ) : (
            items.map(item => (
              <Card key={item.id} className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0 text-red-500"><FileText className="w-5 h-5" /></div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="font-bold text-sm truncate">{item.filename}</h3>
                  <p className="text-xs text-muted-foreground">{fmt(item.created_at)} • {fmtSize(item.size)}</p>
                </div>
                <div className="flex gap-1">
                  <a href={getDocumentDownloadUrl(item.id)} target="_blank" rel="noreferrer">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="w-4 h-4" /></Button>
                  </a>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(item.id)}>Удалить</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
      <ConfirmDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}
        title="Удалить документ?" description="Файл будет удалён без возможности восстановления."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} variant="destructive" actionLabel="Удалить" />
    </div>
  );
}