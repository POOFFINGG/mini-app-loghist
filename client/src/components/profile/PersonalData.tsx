import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Save, User, Building, Mail, Phone, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { updateProfile } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Props { onBack: () => void; }

export function PersonalData({ onBack }: Props) {
  const { user, refetchUser } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: user?.personal?.full_name ?? "",
    position: user?.personal?.position ?? "",
    company: user?.company?.name ?? "",
    email: user?.logistician?.email ?? "",
    phone: user?.logistician?.phone ?? "",
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        personal: { full_name: form.full_name, position: form.position },
        logistician: { email: form.email, phone: form.phone },
      });
      await refetchUser();
      toast({ title: "Данные сохранены" });
      onBack();
    } catch (e: any) {
      toast({ title: "Ошибка", description: e?.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const initials = form.full_name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "ЛГ";

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2"><ArrowLeft className="w-5 h-5" /></Button>
        <h2 className="text-lg font-bold">Личные данные</h2>
      </div>

      <div className="flex flex-col items-center gap-4 py-4">
        <Avatar className="w-24 h-24 border-4 border-background shadow-xl">
          <AvatarFallback className="text-2xl font-bold">{initials}</AvatarFallback>
        </Avatar>
      </div>

      {form.company && (
        <div className="px-3 py-2 rounded-xl bg-secondary/40 border border-border/50 text-sm text-muted-foreground flex items-center gap-2">
          <Building className="w-4 h-4 shrink-0" />
          <span className="truncate">{form.company}</span>
        </div>
      )}

      <div className="space-y-4">
        {[
          { icon: User, label: "ФИО", key: "full_name", placeholder: "Иванов Иван Иванович" },
          { icon: User, label: "Должность", key: "position", placeholder: "Менеджер по логистике" },
          { icon: Mail, label: "Email", key: "email", placeholder: "alex@logist.ru" },
          { icon: Phone, label: "Телефон", key: "phone", placeholder: "+7 (999) 123-45-67" },
        ].map(f => (
          <div key={f.key} className="space-y-2">
            <Label htmlFor={f.key}>{f.label}</Label>
            <div className="relative">
              <f.icon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id={f.key} placeholder={f.placeholder} className="pl-9"
                value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
            </div>
          </div>
        ))}
      </div>

      <Button className="w-full gap-2 bg-[#00b3f2] hover:bg-[#009bd1]" onClick={handleSave} disabled={isSaving}>
        {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" />Сохранение...</> : <><Save className="w-4 h-4" />Сохранить изменения</>}
      </Button>
    </div>
  );
}