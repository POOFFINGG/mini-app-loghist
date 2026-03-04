import { z } from "zod";

// --- 1. General Data ---
export const generalDataSchema = z.object({
  requestId: z.string().optional(), // Auto-generated
  createdAt: z.date().optional(),   // Auto-generated
  transportType: z.enum(["FTL", "LTL", "Combined"]),
  senderContact: z.string().min(2, "Укажите контактное лицо отправителя"),
  receiverContact: z.string().min(2, "Укажите контактное лицо получателя"),
  comment: z.string().optional(),
});

// --- 2. Counterparty ---
export const counterpartySchema = z.object({
  name: z.string().min(2, "Название контрагента обязательно"),
  inn: z.string().regex(/^\d{10,12}$/, "ИНН должен содержать 10 или 12 цифр").optional().or(z.literal("")),
  kpp: z.string().regex(/^\d{9}$/, "КПП должен содержать 9 цифр").optional().or(z.literal("")),
});

// --- 3. Route ---
export const routePointSchema = z.object({
  address: z.string().min(5, "Адрес обязателен"),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  date: z.date({ required_error: "Выберите дату" }),
  time: z.string().optional(), // "HH:mm"
});

export const routeSchema = z.object({
  origin: routePointSchema,
  destination: routePointSchema,
  waypoints: z.array(routePointSchema).optional(),
});

// --- 4. Cargo ---
export const cargoSchema = z.object({
  name: z.string().min(2, "Наименование груза обязательно"),
  packageType: z.string().optional(), // Pallets, boxes, etc.
  weight: z.number().min(0.1, "Укажите вес"),
  volume: z.number().min(0.1, "Укажите объем"),
  quantity: z.number().int().min(1, "Количество мест").optional(),
  conditions: z.array(z.string()).optional(), // Temp, ADR, etc.
});

// --- 5. Transport ---
export const transportSchema = z.object({
  type: z.string().min(2, "Тип ТС обязателен"),
  brand: z.string().optional(),
  truckPlate: z.string().min(1, "Гос. номер тягача обязателен"),
  trailerPlate: z.string().optional(),
});

// --- 6. Driver ---
export const driverSchema = z.object({
  fullName: z.string().min(2, "ФИО водителя обязательно"),
  passport: z.string().min(5, "Паспортные данные обязательны"),
  license: z.string().min(5, "В/У обязательно"),
  phone: z.string().min(10, "Телефон водителя обязателен"),
});

// --- 7. Payment ---
export const paymentSchema = z.object({
  rate: z.number().min(0, "Ставка должна быть положительной"),
  terms: z.string().optional(), // Prepay, postpay...
  vat: z.boolean().default(true),
  method: z.string().optional(),
});

// --- FULL REQUEST SCHEMA ---
export const createRequestSchema = z.object({
  general: generalDataSchema,
  counterparty: counterpartySchema,
  route: routeSchema,
  cargo: cargoSchema,
  transport: transportSchema,
  driver: driverSchema,
  payment: paymentSchema,
});

export type CreateRequestValues = z.infer<typeof createRequestSchema>;
