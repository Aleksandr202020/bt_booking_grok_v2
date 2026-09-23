import type { Sql } from "@/lib/db";
import { getSql } from "@/lib/db";
import {
  addCalendarDays,
  daysBetween,
  getRigaNowParts,
  isClosedHolidayDate,
  isPastSlot,
  isValidIsoDate,
  isWorkingSlot,
  toDateString,
  toTimeString,
} from "@/lib/booking/dates";
import { getPriceCents, isCarCategory } from "@/lib/booking/pricing";
import {
  ACTIVE_BOOKING_STATUSES,
  BOOKING_ERROR_CODES,
  CUSTOMER_WINDOW_DAYS,
  MAX_CUSTOMER_BOOKINGS,
  MAX_CUSTOMER_BOOKINGS_PER_CAR,
  WORKING_SLOTS,
  fail,
  type BookingStatus,
  type SlotState,
} from "@/lib/booking/rules";
import { isUniqueViolation, uniqueCode, withTransaction } from "@/lib/booking/tx";

export type Profile = {
  userId: string;
  phone: string | null;
  role: "customer" | "admin";
  banned: boolean;
  banReason: string | null;
  name: string | null;
  email: string | null;
};

export type CarRow = {
  id: string;
  userId: string;
  makeId: string;
  modelId: string;
  makeName: string;
  modelName: string;
  registrationNumber: string;
  category: string;
  createdAt: string;
};

export type BookingRow = {
  id: string;
  userId: string;
  carId: string;
  bookingDate: string;
  bookingTime: string;
  priceCents: number;
  status: BookingStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  makeName?: string;
  modelName?: string;
  registrationNumber?: string;
  category?: string;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
};

type ProfileRow = {
  user_id: string;
  phone: string | null;
  role: "customer" | "admin";
  banned: boolean;
  ban_reason: string | null;
};

function mapProfile(row: ProfileRow, user?: { name: string | null; email: string | null }): Profile {
  return {
    userId: row.user_id,
    phone: row.phone,
    role: row.role,
    banned: row.banned,
    banReason: row.ban_reason,
    name: user?.name ?? null,
    email: user?.email ?? null,
  };
}

/** Comma-separated admin emails from Vercel env ADMIN_EMAILS (case-insensitive). */
function adminEmailsFromEnv(): Set<string> {
  const raw = process.env.ADMIN_EMAILS?.trim();
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmailsFromEnv().has(email.trim().toLowerCase());
}

export async function ensureProfile(sql: Sql, userId: string): Promise<ProfileRow> {
  await sql`select pg_advisory_xact_lock(hashtext('bt-booking:profile-bootstrap'))`;
  const existing = await sql<ProfileRow>`
    select user_id, phone, role, banned, ban_reason
    from profiles
    where user_id = ${userId}
    limit 1
  `;

  const identity = await loadUserIdentity(sql, userId);
  const emailIsAdmin = isAdminEmail(identity.email);

  if (existing[0]) {
    // Promote allowlisted emails to admin (ADMIN_EMAILS env on Vercel).
    if (emailIsAdmin && existing[0].role !== "admin") {
      const updated = await sql<ProfileRow>`
        update profiles
        set role = 'admin', updated_at = now()
        where user_id = ${userId}
        returning user_id, phone, role, banned, ban_reason
      `;
      return updated[0]!;
    }
    return existing[0];
  }

  const admins = await sql<{ n: number }>`
    select count(*)::int as n from profiles where role = 'admin'
  `;
  // First user becomes admin, or any email listed in ADMIN_EMAILS.
  const role =
    emailIsAdmin || (admins[0]?.n ?? 0) === 0 ? "admin" : "customer";
  const inserted = await sql<ProfileRow>`
    insert into profiles (user_id, role)
    values (${userId}, ${role})
    on conflict (user_id) do update set updated_at = profiles.updated_at
    returning user_id, phone, role, banned, ban_reason
  `;
  return inserted[0]!;
}
