import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Lock, ShieldCheck, Key, Smartphone } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface SecuritySettingsProps {
  onBack: () => void;
}

export function SecuritySettings({ onBack }: SecuritySettingsProps) {
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-bold">Безопасность</h2>
      </div>

      <div className="space-y-6">
        {/* Password Change */}
        <div className="bg-card rounded-xl border p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Key className="w-5 h-5 text-primary" />
            <h3 className="font-bold">Смена пароля</h3>
          </div>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="current-pass">Текущий пароль</Label>
              <Input id="current-pass" type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-pass">Новый пароль</Label>
              <Input id="new-pass" type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirm-pass">Подтвердите пароль</Label>
              <Input id="confirm-pass" type="password" placeholder="••••••••" />
            </div>
            <Button variant="outline" className="w-full">Обновить пароль</Button>
          </div>
        </div>

        {/* 2FA */}
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-600" />
                <h3 className="font-bold">Двухфакторная аутентификация</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Запрашивать код подтверждения при каждом входе с нового устройства.
              </p>
            </div>
            <Switch />
          </div>
        </div>

        {/* Sessions */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">Активные сессии</h3>
          
          <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Smartphone className="w-8 h-8 p-1.5 bg-background rounded-full text-muted-foreground" />
              <div>
                <p className="text-sm font-bold">iPhone 14 Pro</p>
                <p className="text-xs text-muted-foreground">Москва, Россия • Сейчас</p>
              </div>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full" />
          </div>

          <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg opacity-70">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 p-1.5 bg-background rounded-full text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
              </div>
              <div>
                <p className="text-sm font-bold">MacBook Pro</p>
                <p className="text-xs text-muted-foreground">Санкт-Петербург • 2 дня назад</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-destructive text-xs h-7">Выйти</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
