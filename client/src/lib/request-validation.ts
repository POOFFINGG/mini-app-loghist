import { z } from "zod";

// --- 1. General Data ---
export const generalDataSchema = z.object({
  requestId: z.string().optional(),
  createdAt: z.date().optional(),
  transportType: z.enum(["FTL", "LTL", "Combined"]),
  senderContact: z.string().min(2, "Укажите контактное лицо отправителя"),
  receiverContact: z.string().min(2, "Укажите контактное лицо получателя"),
  comment: z.string().optional(),
});

// --- 2. Counterparty (optional in form) ---
export const counterpartySchema = z.object({
  name: z.string().min(2, "Название контрагента обязательно"),
  inn: z.string().regex(/^\d{10,12}$/, "ИНН должен содержать 10 или 12 цифр").optional().or(z.literal("")),
  kpp: z.string().regex(/^\d{9}$/, "КПП должен содержать 9 цифр").optional().or(z.literal("")),
});

// --- 3. Route ---
export const routePointSchema = z.object({
  address: z.string().min(3, "Адрес обязателен"),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  date: z.date().optional(),
  time: z.string().optional(),
});

export const routeSchema = z.object({
  origin: routePointSchema,
  destination: routePointSchema,
  waypoints: z.array(routePointSchema).optional(),
});

// --- 4. Cargo ---
export const cargoSchema = z.object({
  name: z.string().min(2, "Наименование груза обязательно"),
  packageType: z.string().optional(),
  weight: z.number().min(0, "Укажите вес").optional(),
  volume: z.number().min(0, "Укажите объем").optional(),
  quantity: z.number().int().min(1).optional(),
  conditions: z.array(z.string()).optional(),
});

// --- 5. Transport ---
export const transportSchema = z.object({
  type: z.string().optional(),
  brand: z.string().optional(),
  plateTractor: z.string().optional(),
  plateTrailer: z.string().optional(),
});

// --- 6. Driver ---
export const driverSchema = z.object({
  fullName: z.string().min(2, "ФИО водителя обязательно"),
  passport: z.string().optional(),
  license: z.string().optional(),
  phone: z.string().optional(),
});

// --- 7. Payment ---
export const paymentSchema = z.object({
  rate: z.number().min(0).optional(),
  terms: z.string().optional(),
  vat: z.boolean().default(true),
  method: z.string().optional(),
});

// --- FULL REQUEST SCHEMA ---
export const createRequestSchema = z.object({
  general: generalDataSchema,
  counterparty: counterpartySchema.optional(),
  route: routeSchema,
  cargo: cargoSchema,
  transport: transportSchema.optional(),
  driver: driverSchema.optional(),
  payment: paymentSchema.optional(),
});

export type CreateRequestValues = z.infer<typeof createRequestSchema>;
