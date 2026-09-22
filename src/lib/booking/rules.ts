export const APP_TIMEZONE = "Europe/Riga" as const;

export const OPENING_HOUR = 9;
export const CLOSING_HOUR = 21;
export const SLOT_MINUTES = 60;
export const CUSTOMER_WINDOW_DAYS = 30;
export const MAX_CUSTOMER_BOOKINGS = 3;
export const MAX_CUSTOMER_BOOKINGS_PER_CAR = 2;

export const WORKING_SLOTS = Array.from(
  { length: CLOSING_HOUR - OPENING_HOUR },
  (_, index) => `${String(OPENING_HOUR + index).padStart(2, "0")}:00`,
) as readonly string[];

export const ACTIVE_BOOKING_STATUSES = ["pending", "confirmed"] as const;
export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled_customer",
  "cancelled_admin",
  "no_show",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export type CarCategory = "passenger" | "crossover" | "minivan" | "commercial";
export type SlotState =
  | "available"
  | "booked"
  | "blocked"
  | "past"
  | "holiday"
  | "outside_booking_window";

export const CLOSED_HOLIDAYS = [
  { month: 6, day: 23, name: "Līgo diena" },
  { month: 6, day: 24, name: "Jāņi" },
] as const;

export const BOOKING_ERROR_CODES = {
  AUTH_REQUIRED: "AUTH_REQUIRED",
  FORBIDDEN: "FORBIDDEN",
  INVALID_DATE: "INVALID_DATE",
  INVALID_SLOT: "INVALID_SLOT",
  BOOKING_DATE_OUT_OF_RANGE: "BOOKING_DATE_OUT_OF_RANGE",
  CAR_NOT_FOUND: "CAR_NOT_FOUND",
  CAR_NOT_OWNED: "CAR_NOT_OWNED",
  CLIENT_BANNED: "CLIENT_BANNED",
  HOLIDAY: "HOLIDAY",
  SLOT_BLOCKED: "SLOT_BLOCKED",
  SLOT_UNAVAILABLE: "SLOT_UNAVAILABLE",
  BOOKING_LIMIT_REACHED: "BOOKING_LIMIT_REACHED",
  CAR_BOOKING_LIMIT_REACHED: "CAR_BOOKING_LIMIT_REACHED",
  INVALID_VEHICLE_MODEL: "INVALID_VEHICLE_MODEL",
  REGISTRATION_ALREADY_EXISTS: "REGISTRATION_ALREADY_EXISTS",
  CAR_HAS_ACTIVE_BOOKING: "CAR_HAS_ACTIVE_BOOKING",
  PHONE_REQUIRED: "PHONE_REQUIRED",
  WHOLE_DAY_BLOCK_CONFLICT: "WHOLE_DAY_BLOCK_CONFLICT",
  SLOT_BLOCK_CONFLICT_WITH_WHOLE_DAY: "SLOT_BLOCK_CONFLICT_WITH_WHOLE_DAY",
  BOOKING_NOT_FOUND_OR_NOT_CANCELLABLE: "BOOKING_NOT_FOUND_OR_NOT_CANCELLABLE",
} as const;

export type BookingErrorCode =
  (typeof BOOKING_ERROR_CODES)[keyof typeof BOOKING_ERROR_CODES];

export const ERROR_MESSAGES_LV: Record<string, string> = {
  AUTH_REQUIRED: "Nepieciešama autorizācija.",
  FORBIDDEN: "Nav piekļuves.",
  INVALID_DATE: "Nederīgs datums.",
  INVALID_SLOT: "Nederīgs laiks.",
  BOOKING_DATE_OUT_OF_RANGE: "Šis laiks vairs nav pieejams.",
  CAR_NOT_FOUND: "Automašīna nav atrasta.",
  CAR_NOT_OWNED: "Šī automašīna jums nepieder.",
  CLIENT_BANNED: "Konts ir bloķēts. Jaunas rezervācijas nav iespējamas.",
  HOLIDAY: "Šajā dienā auto mazgātava ir slēgta.",
  SLOT_BLOCKED: "Šis laiks ir bloķēts.",
  SLOT_UNAVAILABLE: "Šis laiks tikko tika aizņemts.",
  BOOKING_LIMIT_REACHED: "Sasniegts aktīvo rezervāciju limits (3).",
  CAR_BOOKING_LIMIT_REACHED: "Šai automašīnai jau ir maksimālais rezervāciju skaits.",
  INVALID_VEHICLE_MODEL: "Marka vai modelis nav katalogā.",
  REGISTRATION_ALREADY_EXISTS: "Šāds numurs jau ir reģistrēts.",
  CAR_HAS_ACTIVE_BOOKING: "Automašīnai ir aktīva rezervācija.",
  PHONE_REQUIRED: "Pirms rezervācijas norādiet tālruņa numuru.",
  WHOLE_DAY_BLOCK_CONFLICT: "Šajā dienā jau ir bloķēti atsevišķi stundu laiki.",
  SLOT_BLOCK_CONFLICT_WITH_WHOLE_DAY: "Šī diena jau ir bloķēta pilnībā.",
  BOOKING_NOT_FOUND_OR_NOT_CANCELLABLE: "Rezervāciju vairs nevar atcelt.",
  Unauthorized: "Nepieciešama autorizācija.",
};

export function messageForError(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  return ERROR_MESSAGES_LV[raw] ?? (raw || "Neizdevās izpildīt darbību.");
}

export class BookingError extends Error {
  code: string;
  status: number;
  constructor(code: string, status = 409) {
    super(code);
    this.name = "BookingError";
    this.code = code;
    this.status = status;
  }
}

export function fail(code: string, status = 409): never {
  throw new BookingError(code, status);
}
