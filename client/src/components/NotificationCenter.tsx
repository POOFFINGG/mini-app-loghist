import { useState } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet";
import { Bell, Settings, MessageSquare, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

type Notification = {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "info" | "warning" | "success";
};

export function NotificationCenter({ 
  open, 
  onOpenChange 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
}) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Заявка подтверждена",
      message: "Ваша заявка #REQ-2024-001 была успешно подтверждена.",
      time: "10:30",
      read: false,
      type: "success"
    },
    {
      id: "2",
      title: "Требуется действие",
      message: "Необходимо загрузить документы для заявки #REQ-2024-002.",
      time: "Вчера",
      read: false,
      type: "warning"
    },
    {
      id: "3",
      title: "Новое сообщение",
      message: "Логист оставил комментарий к вашей заявке.",
      time: "Вчера",
      read: true,
      type: "info"
    }
  ]);

  const [showSettings, setShowSettings] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  if (showSettings) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader className="space-y-4 mb-6">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setShowSettings(false)} className="-ml-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <SheetTitle>Настройки уведомлений</SheetTitle>
            </div>
            <SheetDescription>
              Управляйте тем, как вы получаете уведомления
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-6">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="push" className="flex flex-col space-y-1">
                <span>Push-уведомления</span>
                <span className="font-normal text-xs text-muted-foreground">Моментальные уведомления на телефон</span>
              </Label>
              <Switch id="push" defaultChecked />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="email" className="flex flex-col space-y-1">
                <span>Email рассылка</span>
                <span className="font-normal text-xs text-muted-foreground">Отчеты и важные обновления</span>
              </Label>
              <Switch id="email" defaultChecked />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="sms" className="flex flex-col space-y-1">
                <span>SMS уведомления</span>
                <span className="font-normal text-xs text-muted-foreground">Только критические обновления</span>
              </Label>
              <Switch id="sms" />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col h-full p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              Уведомления
              {unreadCount > 0 && (
                <Badge variant="secondary" className="bg-[#00b3f2] text-white hover:bg-[#00b3f2]/90">
                  {unreadCount}
                </Badge>
              )}
            </SheetTitle>
            <div className="flex gap-1">
               <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)} title="Настройки">
                <Settings className="h-5 w-5" />
              </Button>
              {unreadCount > 0 && (
                 <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs">
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
                <h3 className="font-medium text-lg">Нет новых уведомлений</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Здесь будут появляться важные сообщения о ваших заявках
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`p-4 border-b hover:bg-muted/50 transition-colors cursor-pointer flex gap-3 ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                  onClick={() => {
                     setNotifications(prev => prev.map(n => 
                       n.id === notification.id ? { ...n, read: true } : n
                     ));
                  }}
                >
                  <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!notification.read ? 'bg-[#00b3f2]' : 'bg-transparent'}`} />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between">
                      <h4 className={`text-sm font-medium leading-none ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {notification.title}
                      </h4>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {notification.time}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    {notification.type === 'success' && (
                        <div className="flex items-center gap-1 mt-1.5">
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            <span className="text-[10px] text-green-600 font-medium">Успешно</span>
                        </div>
                    )}
                    {notification.type === 'warning' && (
                        <div className="flex items-center gap-1 mt-1.5">
                            <AlertCircle className="w-3 h-3 text-amber-500" />
                            <span className="text-[10px] text-amber-600 font-medium">Важно</span>
                        </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

import { ArrowLeft } from "lucide-react";
