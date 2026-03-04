import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bell, Mail, MessageSquare, Smartphone } from "lucide-react";

interface NotificationsSettingsProps {
  onBack: () => void;
}

export function NotificationsSettings({ onBack }: NotificationsSettingsProps) {
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-bold">Уведомления</h2>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Каналы связи</h3>
          
          <div className="flex items-center justify-between p-4 bg-card rounded-xl border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <Label className="text-base">Push-уведомления</Label>
                <p className="text-xs text-muted-foreground">Моментальные оповещения на телефон</p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between p-4 bg-card rounded-xl border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-orange-600">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <Label className="text-base">Email рассылка</Label>
                <p className="text-xs text-muted-foreground">Отчеты и важные новости</p>
              </div>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between p-4 bg-card rounded-xl border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center text-green-600">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <Label className="text-base">SMS уведомления</Label>
                <p className="text-xs text-muted-foreground">Только критические обновления</p>
              </div>
            </div>
            <Switch />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Типы уведомлений</h3>
          
          <div className="space-y-4 px-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="n1" className="flex-1">Изменение статуса заявки</Label>
              <Switch id="n1" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="n2" className="flex-1">Новые документы</Label>
              <Switch id="n2" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="n3" className="flex-1">Напоминания об оплате</Label>
              <Switch id="n3" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="n4" className="flex-1">Новости сервиса</Label>
              <Switch id="n4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
