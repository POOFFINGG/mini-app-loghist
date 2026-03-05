import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Bell, Settings, CheckCircle2, AlertCircle, Info, Headphones, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listNotifications, markNotificationRead, markAllNotificationsRead, type Notification } from "@/lib/api";
import { format, parseISO, isToday, isYesterday } from "date-fns";
import { ru } from "date-fns/locale";
import { useLocation } from "wouter";

function formatTime(iso: string): string {
  try {
    const d = parseISO(iso);
    if (isToday(d)) return format(d, "HH:mm");
    if (isYesterday(d)) return "Вчера";
    return format(d, "d MMM", { locale: ru });
  } catch { return ""; }
}

export function NotificationCenter({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const qc = useQueryClient();
  const [, setLocation] = useLocation();

  const openSettings = () => {
    onOpenChange(false);
    setLocation("/profile?section=notifications");
  };

  const handleNotificationClick = (n: Notification) => {
    if (!n.read) markRead.mutate(n.id);
    if (n.type === "support") {
      onOpenChange(false);
      setLocation("/profile?section=support&chat=1");
    } else if (n.request_id) {
      onOpenChange(false);
      setLocation(`/requests/${n.request_id}`);
    }
  };

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: () => listNotifications(),
    enabled: open,
    staleTime: 30000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAll = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              Уведомления
              {unreadCount > 0 && (
                <Badge variant="secondary" className="bg-[#00b3f2] text-white hover:bg-[#00b3f2]/90">{unreadCount}</Badge>
              )}
            </SheetTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={openSettings}>
                <Settings className="h-5 w-5" />
              </Button>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={() => markAll.mutate()} className="text-xs">
                  Прочитать все
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>
        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Bell className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="font-medium text-lg">Нет уведомлений</h3>
                <p className="text-sm text-muted-foreground mt-1">Здесь будут появляться важные сообщения о ваших заявках</p>
              </div>
            ) : (
              notifications.map((n) => {
                const isNavigable = n.type === "support" || !!n.request_id;
                return (
                  <div
                    key={n.id}
                    className={`p-4 border-b hover:bg-muted/50 transition-colors flex gap-3 ${!n.read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""} ${isNavigable ? "cursor-pointer" : "cursor-default"}`}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!n.read ? "bg-[#00b3f2]" : "bg-transparent"}`} />
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`text-sm font-medium leading-none ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</h4>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{formatTime(n.created_at)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{n.message}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex items-center gap-1">
                          {n.type === "support" && <><Headphones className="w-3 h-3 text-green-500" /><span className="text-[10px] text-green-600 font-medium">Поддержка</span></>}
                          {n.type === "success" && <><CheckCircle2 className="w-3 h-3 text-green-500" /><span className="text-[10px] text-green-600 font-medium">Успешно</span></>}
                          {n.type === "warning" && <><AlertCircle className="w-3 h-3 text-amber-500" /><span className="text-[10px] text-amber-600 font-medium">Важно</span></>}
                          {n.type === "info" && <><Info className="w-3 h-3 text-blue-500" /><span className="text-[10px] text-blue-600 font-medium">Информация</span></>}
                        </div>
                        {isNavigable && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}