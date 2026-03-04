import { z } from "zod";

export const loginSchema = z.object({
  emailOrPhone: z.string().min(1, "Введите email или телефон"),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
});

export const personalDataSchema = z.object({
  fullName: z.string().min(2, "ФИО должно содержать минимум 2 символа"),
  position: z.string().min(2, "Должность должна быть указана"),
});

export const companyDataSchema = z.object({
  companyName: z.string().min(2, "Название компании обязательно"),
  legalAddress: z.string().min(5, "Юридический адрес обязателен"),
  inn: z.string().refine((val) => /^\d{10}$|^\d{12}$/.test(val), {
    message: "ИНН должен содержать 10 или 12 цифр",
  }),
  kpp: z.string().refine((val) => /^\d{9}$/.test(val), {
    message: "КПП должен содержать 9 цифр",
  }),
  ogrn: z.string().refine((val) => /^\d{13}$|^\d{15}$/.test(val), {
    message: "ОГРН должен содержать 13 или 15 цифр",
  }),
  contactPhone: z.string().min(10, "Введите корректный номер телефона"),
  contactEmail: z.string().email("Введите корректный email"),
});

export const bankDataSchema = z.object({
  bik: z.string().optional(),
  accountNumber: z.string().optional(),
  corrAccount: z.string().optional(),
  bankName: z.string().optional(),
});

export const logisticianSchema = z.object({
  logistPhone: z.string().min(10, "Введите телефон логиста"),
  logistEmail: z.string().email("Введите email логиста"),
});

// Combined schema for final submission if needed, but we will likely validate step by step
export const registerSchema = z.intersection(
    personalDataSchema,
    z.intersection(
        companyDataSchema,
        z.intersection(bankDataSchema, logisticianSchema)
    )
);

export type LoginFormValues = z.infer<typeof loginSchema>;
export type PersonalDataValues = z.infer<typeof personalDataSchema>;
export type CompanyDataValues = z.infer<typeof companyDataSchema>;
export type BankDataValues = z.infer<typeof bankDataSchema>;
export type LogisticianValues = z.infer<typeof logisticianSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
