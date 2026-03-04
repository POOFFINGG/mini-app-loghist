import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Save, User, Building, Mail, Phone } from "lucide-react";

interface PersonalDataProps {
  onBack: () => void;
}

export function PersonalData({ onBack }: PersonalDataProps) {
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-bold">Личные данные</h2>
      </div>

      <div className="flex flex-col items-center gap-4 py-4">
        <div className="relative">
          <Avatar className="w-24 h-24 border-4 border-background shadow-xl">
            <AvatarImage src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" />
            <AvatarFallback>AL</AvatarFallback>
          </Avatar>
          <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 rounded-full h-8 w-8 shadow-sm">
            <User className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Нажмите на фото, чтобы изменить</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullname">ФИО</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input id="fullname" defaultValue="Александр Александров" className="pl-9" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="company">Компания</Label>
          <div className="relative">
            <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input id="company" defaultValue="ООО «Логист»" className="pl-9" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input id="email" defaultValue="alex@logist.ru" className="pl-9" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Телефон</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input id="phone" defaultValue="+7 (999) 123-45-67" className="pl-9" />
          </div>
        </div>
      </div>

      <Button className="w-full gap-2 bg-[#00b3f2] hover:bg-[#009bd1]">
        <Save className="w-4 h-4" />
        Сохранить изменения
      </Button>
    </div>
  );
}
