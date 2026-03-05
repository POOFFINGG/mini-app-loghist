import { useState } from "react";
import { Link, useLocation } from "wouter";
import logo from "@assets/logo.png";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  personalDataSchema, companyDataSchema, bankDataSchema, logisticianSchema,
  type PersonalDataValues, type CompanyDataValues, type BankDataValues, type LogisticianValues,
} from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { register as apiRegister, setTokens } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type Step = 1 | 2 | 3 | 4;

export default function Register() {
  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { refetchUser } = useAuth();
  const [formData, setFormData] = useState<any>({});

  const personalForm = useForm<PersonalDataValues>({ resolver: zodResolver(personalDataSchema), defaultValues: { fullName: "", position: "" } });
  const companyForm = useForm<CompanyDataValues>({ resolver: zodResolver(companyDataSchema), defaultValues: { companyName: "", legalAddress: "", inn: "", kpp: "", ogrn: "", contactPhone: "", contactEmail: "" } });
  const bankForm = useForm<BankDataValues>({ resolver: zodResolver(bankDataSchema), defaultValues: { bik: "", accountNumber: "", corrAccount: "", bankName: "" } });
  const logisticianForm = useForm<LogisticianValues>({ resolver: zodResolver(logisticianSchema), defaultValues: { logistPhone: "", logistEmail: "" } });

  const handleStep1 = (data: PersonalDataValues) => { setFormData((p: any) => ({ ...p, ...data })); setStep(2); };
  const handleStep2 = (data: CompanyDataValues) => { setFormData((p: any) => ({ ...p, ...data })); setStep(3); };
  const handleStep3 = (data: BankDataValues) => { setFormData((p: any) => ({ ...p, ...data })); setStep(4); };

  const handleFinalSubmit = async (data: LogisticianValues) => {
    const final = { ...formData, ...data };
    setIsLoading(true);
    try {
      const digits = final.logistPhone.replace(/\D/g, "").slice(-6);
      const password = digits + Math.random().toString(36).slice(2, 6);
      const hasBankData = final.bankName && final.bik && final.accountNumber && final.corrAccount;
      const tokens = await apiRegister({
        email: final.logistEmail,
        phone: final.logistPhone,
        password,
        pd_consent: true,
        personal: { full_name: final.fullName, position: final.position },
        company: {
          name: final.companyName,
          legal_address: final.legalAddress,
          inn: final.inn,
          kpp: final.kpp || undefined,
          ogrn: final.ogrn,
          contact_phone: final.contactPhone,
          contact_email: final.contactEmail,
        },
        bank: hasBankData ? {
          bank_name: final.bankName,
          bik: final.bik,
          account_number: final.accountNumber,
          correspondent_account: final.corrAccount,
        } : undefined,
        logistician: { phone: final.logistPhone, email: final.logistEmail },
      });
      setTokens(tokens.access_token, tokens.refresh_token);
      await refetchUser();
      toast({ title: "Регистрация успешна", description: "Временный пароль: " + password + " — смените в профиле" });
      setLocation("/home");
    } catch (error: any) {
      toast({ title: "Ошибка", description: error?.message || "Не удалось создать аккаунт", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent"
              onClick={() => step > 1 && setStep((s) => (s - 1) as Step)} disabled={step === 1 || isLoading}>
              {step > 1 && <ArrowLeft className="h-4 w-4 mr-1" />}{step > 1 ? "Назад" : ""}
            </Button>
            <span className="text-sm text-muted-foreground">Шаг {step} из 4</span>
          </div>
          <Progress value={(step / 4) * 100} className="h-2 mb-4" />
          <div className="flex justify-center mb-2"><img src={logo} alt="Логист ИИ" className="h-12 w-auto object-contain" /></div>
          <CardTitle className="text-2xl">Регистрация компании</CardTitle>
          <CardDescription>
            {step === 1 && "Личные данные сотрудника"}
            {step === 2 && "Информация о компании"}
            {step === 3 && "Банковские реквизиты (опционально)"}
            {step === 4 && "Контактные данные логиста"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <Form {...personalForm}>
              <form onSubmit={personalForm.handleSubmit(handleStep1)} className="space-y-4">
                <FormField control={personalForm.control} name="fullName" render={({ field }) => (
                  <FormItem><FormLabel>ФИО</FormLabel><FormControl><Input placeholder="Иванов Иван Иванович" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={personalForm.control} name="position" render={({ field }) => (
                  <FormItem><FormLabel>Должность</FormLabel><FormControl><Input placeholder="Менеджер по логистике" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" className="w-full mt-4">Далее <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </form>
            </Form>
          )}
          {step === 2 && (
            <Form {...companyForm}>
              <form onSubmit={companyForm.handleSubmit(handleStep2)} className="space-y-4">
                <FormField control={companyForm.control} name="companyName" render={({ field }) => (
                  <FormItem><FormLabel>Название компании</FormLabel><FormControl><Input placeholder="ООО Ромашка" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={companyForm.control} name="legalAddress" render={({ field }) => (
                  <FormItem><FormLabel>Юридический адрес</FormLabel><FormControl><Input placeholder="г. Москва, ул. Пушкина, д. 10" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={companyForm.control} name="inn" render={({ field }) => (
                    <FormItem><FormLabel>ИНН</FormLabel><FormControl><Input placeholder="10 или 12 цифр" maxLength={12} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={companyForm.control} name="kpp" render={({ field }) => (
                    <FormItem><FormLabel>КПП</FormLabel><FormControl><Input placeholder="9 цифр" maxLength={9} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={companyForm.control} name="ogrn" render={({ field }) => (
                  <FormItem><FormLabel>ОГРН</FormLabel><FormControl><Input placeholder="13 или 15 цифр" maxLength={15} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={companyForm.control} name="contactPhone" render={({ field }) => (
                    <FormItem><FormLabel>Телефон</FormLabel><FormControl><Input placeholder="+7..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={companyForm.control} name="contactEmail" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="info@company.com" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <Button type="submit" className="w-full mt-4">Далее <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </form>
            </Form>
          )}
          {step === 3 && (
            <Form {...bankForm}>
              <form onSubmit={bankForm.handleSubmit(handleStep3)} className="space-y-4">
                <FormField control={bankForm.control} name="bankName" render={({ field }) => (
                  <FormItem><FormLabel>Наименование банка</FormLabel><FormControl><Input placeholder="Сбербанк" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={bankForm.control} name="bik" render={({ field }) => (
                  <FormItem><FormLabel>БИК</FormLabel><FormControl><Input placeholder="044..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={bankForm.control} name="accountNumber" render={({ field }) => (
                  <FormItem><FormLabel>Расчётный счёт</FormLabel><FormControl><Input placeholder="407..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={bankForm.control} name="corrAccount" render={({ field }) => (
                  <FormItem><FormLabel>Корр. счёт</FormLabel><FormControl><Input placeholder="301..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="flex gap-2 mt-4">
                  <Button type="button" variant="outline" className="w-1/3" onClick={() => handleStep3(bankForm.getValues())}>Пропустить</Button>
                  <Button type="submit" className="w-2/3">Далее <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </div>
              </form>
            </Form>
          )}
          {step === 4 && (
            <Form {...logisticianForm}>
              <form onSubmit={logisticianForm.handleSubmit(handleFinalSubmit)} className="space-y-4">
                <FormField control={logisticianForm.control} name="logistPhone" render={({ field }) => (
                  <FormItem><FormLabel>Телефон логиста (для входа)</FormLabel><FormControl><Input placeholder="+7..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={logisticianForm.control} name="logistEmail" render={({ field }) => (
                  <FormItem><FormLabel>Email логиста (для входа)</FormLabel><FormControl><Input placeholder="logist@company.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <p className="text-xs text-muted-foreground bg-secondary/50 p-3 rounded-lg">После регистрации получите временный пароль. Смените его в Профиле → Безопасность.</p>
                <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Регистрация...</> : <><Check className="mr-2 h-4 w-4" />Завершить регистрацию</>}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {step === 1 && (
            <p className="text-sm text-muted-foreground">Уже есть аккаунт?{" "}
              <Link href="/auth" className="text-primary font-medium hover:underline">Войти</Link>
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
