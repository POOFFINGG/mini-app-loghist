import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Eye, EyeOff, Lock, Loader2 } from "lucide-react";
import { changePassword } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Props { onBack: () => void; }

export function SecuritySettings({ onBack }: Props) {
  const { toast } = useToast();
  const [form, setForm] = useState({ old: "", new1: "", new2: "" });
  const [show, setShow] = useState({ old: false, new1: false, new2: false });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    if (form.new1 !== form.new2) { toast({ title: "Пароли не совпадают", variant: "destructive" }); return; }
    if (form.new1.length < 6) { toast({ title: "Пароль слишком короткий (минимум 6 символов)", variant: "destructive" }); return; }
    setIsSaving(true);
    try {
      await changePassword(form.old, form.new1);
      toast({ title: "Пароль изменён" });
      setForm({ old: "", new1: "", new2: "" });
      onBack();
    } catch (e: any) {
      toast({ title: "Ошибка", description: e?.message || "Неверный текущий пароль", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const PasswordField = ({ id, label, value, showKey }: { id: string; label: string; value: string; showKey: "old" | "new1" | "new2" }) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input id={id} type={(show as any)[showKey] ? "text" : "password"} placeholder="••••••" className="pl-9 pr-10"
          value={value} onChange={e => setForm(p => ({ ...p, [showKey]: e.target.value }))} />
        <button type="button" onClick={() => setShow(p => ({ ...p, [showKey]: !(p as any)[showKey] }))}
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
          {(show as any)[showKey] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2"><ArrowLeft className="w-5 h-5" /></Button>
        <h2 className="text-lg font-bold">Безопасность</h2>
      </div>
      <div className="bg-white dark:bg-card rounded-2xl p-5 border border-border/50 space-y-4">
        <h3 className="font-semibold">Смена пароля</h3>
        <PasswordField id="old" label="Текущий пароль" value={form.old} showKey="old" />
        <PasswordField id="new1" label="Новый пароль" value={form.new1} showKey="new1" />
        <PasswordField id="new2" label="Подтвердите новый пароль" value={form.new2} showKey="new2" />
        <Button className="w-full bg-[#00b3f2] hover:bg-[#009bd1]" onClick={handleSubmit} disabled={isSaving || !form.old || !form.new1}>
          {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Сохранение...</> : "Изменить пароль"}
        </Button>
      </div>
    </div>
  );
}