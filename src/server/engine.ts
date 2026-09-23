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

export async function writeAudit(
  sql: Sql,
  input: {
    actorId: string | null;
    action: string;
    targetId?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  await sql`
    insert into audit_logs (actor_id, action, target_id, metadata)
    values (
      ${input.actorId},
      ${input.action},
      ${input.targetId ?? null},
      ${JSON.stringify(input.metadata ?? {})}::jsonb
    )
  `;
}

async function loadUserIdentity(sql: Sql, userId: string) {
  const rows = await sql<{ name: string; email: string }>`
    select name, email from "user" where id = ${userId} limit 1
  `;
  return rows[0] ?? { name: null, email: null };
}

export async function getProfileForUser(userId: string): Promise<Profile> {
  return withTransaction(async (sql) => {
    const row = await ensureProfile(sql, userId);
    const identity = await loadUserIdentity(sql, userId);
    return mapProfile(row, identity);
  });
}

export async function requireProfile(sql: Sql, userId: string): Promise<ProfileRow> {
  return ensureProfile(sql, userId);
}

export async function requireAdmin(userId: string): Promise<Profile> {
  const profile = await getProfileForUser(userId);
  if (profile.role !== "admin") fail(BOOKING_ERROR_CODES.FORBIDDEN, 403);
  return profile;
}

export async function updatePhone(userId: string, phone: string): Promise<Profile> {
  return withTransaction(async (sql) => {
    await ensureProfile(sql, userId);
    const rows = await sql<ProfileRow>`
      update profiles
      set phone = ${phone}, updated_at = now()
      where user_id = ${userId}
      returning user_id, phone, role, banned, ban_reason
    `;
    const identity = await loadUserIdentity(sql, userId);
    await writeAudit(sql, {
      actorId: userId,
      action: "profile.phone_updated",
      targetId: userId,
    });
    return mapProfile(rows[0]!, identity);
  });
}

type SettingRow = { key: string; value: unknown };

function settingNumber(rows: SettingRow[], key: string, fallback: number): number {
  const raw = rows.find((r) => r.key === key)?.value;
  return typeof raw === "number" ? raw : fallback;
}

async function customerWindow(sql: Sql) {
  const settings = await sql<SettingRow>`
    select key, value from app_settings where key = 'customer_booking_window_days'
  `;
  const windowDays = settingNumber(settings, "customer_booking_window_days", CUSTOMER_WINDOW_DAYS);
  const { date: today } = getRigaNowParts();
  return { start: today, end: addCalendarDays(today, windowDays), windowDays };
}

export async function listCatalog() {
  const sql = await getSql();
  const makes = await sql<{ id: string; name: string }>`
    select id, name from vehicle_makes where active = true order by name
  `;
  const models = await sql<{
    id: string;
    make_id: string;
    name: string;
    category: string;
  }>`
    select id, make_id, name, category
    from vehicle_models
    where active = true
    order by name
  `;
  return {
    makes,
    models: models.map((m) => ({
      id: m.id,
      makeId: m.make_id,
      name: m.name,
      category: m.category,
    })),
  };
}

function mapCar(row: {
  id: string;
  user_id: string;
  make_id: string;
  model_id: string;
  make_name: string;
  model_name: string;
  registration_number: string;
  category: string;
  created_at: string;
}): CarRow {
  return {
    id: row.id,
    userId: row.user_id,
    makeId: row.make_id,
    modelId: row.model_id,
    makeName: row.make_name,
    modelName: row.model_name,
    registrationNumber: row.registration_number,
    category: row.category,
    createdAt: String(row.created_at),
  };
}

export async function listCarsForUser(userId: string): Promise<CarRow[]> {
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    user_id: string;
    make_id: string;
    model_id: string;
    make_name: string;
    model_name: string;
    registration_number: string;
    category: string;
    created_at: string;
  }>`
    select id, user_id, make_id, model_id, make_name, model_name, registration_number, category, created_at
    from cars
    where user_id = ${userId}
    order by created_at desc
  `;
  return rows.map(mapCar);
}

export async function createCar(input: {
  userId: string;
  makeId: string;
  modelId: string;
  registrationNumber: string;
}): Promise<CarRow> {
  const registration = input.registrationNumber.trim().toUpperCase().replace(/\s+/g, "");
  return withTransaction(async (sql) => {
    await sql`select pg_advisory_xact_lock(hashtext('bt-booking:vehicle-catalog'))`;
    const profile = await ensureProfile(sql, input.userId);
    if (profile.banned) fail(BOOKING_ERROR_CODES.CLIENT_BANNED, 403);

    const models = await sql<{
      id: string;
      make_id: string;
      name: string;
      category: string;
      make_name: string;
    }>`
      select v.id, v.make_id, v.name, v.category, m.name as make_name
      from vehicle_models v
      join vehicle_makes m on m.id = v.make_id
      where v.id = ${input.modelId}
        and m.id = ${input.makeId}
        and v.active = true
        and m.active = true
      limit 1
    `;
    const model = models[0];
    if (!model || !isCarCategory(model.category)) {
      fail(BOOKING_ERROR_CODES.INVALID_VEHICLE_MODEL, 400);
    }

    await sql`select pg_advisory_xact_lock(hashtext(${`booking-user:${input.userId}`}))`;

    try {
      const inserted = await sql<{
        id: string;
        user_id: string;
        make_id: string;
        model_id: string;
        make_name: string;
        model_name: string;
        registration_number: string;
        category: string;
        created_at: string;
      }>`
        insert into cars (
          user_id, make_id, model_id, make_name, model_name, registration_number, category
        )
        values (
          ${input.userId}, ${model.make_id}, ${model.id}, ${model.make_name},
          ${model.name}, ${registration}, ${model.category}
        )
        returning id, user_id, make_id, model_id, make_name, model_name, registration_number, category, created_at
      `;
      const car = mapCar(inserted[0]!);
      await writeAudit(sql, {
        actorId: input.userId,
        action: "car.created",
        targetId: car.id,
        metadata: {
          make: car.makeName,
          model: car.modelName,
          registrationNumber: car.registrationNumber,
          category: car.category,
        },
      });
      return car;
    } catch (error) {
      if (isUniqueViolation(error)) fail(BOOKING_ERROR_CODES.REGISTRATION_ALREADY_EXISTS, 409);
      throw error;
    }
  });
}

export async function deleteCar(userId: string, carId: string): Promise<void> {
  await withTransaction(async (sql) => {
    const profile = await ensureProfile(sql, userId);
    if (profile.banned) {
      /* banned users may still manage existing cars for cancellation flow */
    }
    const active = await sql<{ n: number }>`
      select count(*)::int as n
      from bookings
      where car_id = ${carId}
        and user_id = ${userId}
        and status in ('pending', 'confirmed')
    `;
    if ((active[0]?.n ?? 0) > 0) fail(BOOKING_ERROR_CODES.CAR_HAS_ACTIVE_BOOKING, 409);

    const deleted = await sql<{ id: string }>`
      delete from cars
      where id = ${carId} and user_id = ${userId}
      returning id
    `;
    if (!deleted[0]) fail(BOOKING_ERROR_CODES.CAR_NOT_FOUND, 404);
    await writeAudit(sql, {
      actorId: userId,
      action: "car.deleted",
      targetId: carId,
    });
  });
}

type SlotRow = {
  time: string;
  state: SlotState;
  available: boolean;
  reason?: string;
  bookingId?: string | null;
  customerName?: string | null;
  registrationNumber?: string | null;
  priceCents?: number | null;
};

export async function getSlotAvailability(
  date: string,
  opts: { role: "customer" | "admin" },
): Promise<{ date: string; holiday: string | null; slots: SlotRow[] }> {
  if (!isValidIsoDate(date)) fail(BOOKING_ERROR_CODES.INVALID_DATE, 400);
  const sql = await getSql();
  const [bookings, blocks, holidays] = await Promise.all([
    sql<{
      booking_time: string;
      id: string;
      user_id: string;
      car_id: string;
      status: string;
      price_cents: number;
      customer_name: string | null;
      registration_number: string | null;
    }>`
      select
        b.booking_time, b.id, b.user_id, b.car_id, b.status, b.price_cents,
        u.name as customer_name, c.registration_number
      from bookings b
      left join "user" u on u.id = b.user_id
      left join cars c on c.id = b.car_id
      where b.booking_date = ${date}
        and b.status in ('pending', 'confirmed')
    `,
    sql<{ booking_time: string | null; reason: string }>`
      select booking_time, reason from blocked_slots where booking_date = ${date}
    `,
    sql<{ name: string }>`
      select name from holidays where date = ${date} and active = true limit 1
    `,
  ]);

  const closed = isClosedHolidayDate(date);
  const holidayName = holidays[0]?.name ?? (closed.closed ? closed.name : null);
  const wholeDayBlock = blocks.some((row) => row.booking_time == null);
  const withinWindow =
    opts.role === "admin"
      ? true
      : (() => {
          const { date: today } = getRigaNowParts();
          const delta = daysBetween(today, date);
          return delta >= 0 && delta <= CUSTOMER_WINDOW_DAYS;
        })();

  const bookingByTime = new Map(
    bookings.map((row) => [toTimeString(row.booking_time), row]),
  );
  const blockByTime = new Map(
    blocks
      .filter((row) => row.booking_time != null)
      .map((row) => [toTimeString(row.booking_time), row]),
  );

  const slots = WORKING_SLOTS.map((time) => {
    let state: SlotState = "available";
    let reason: string | undefined;
    if (holidayName) {
      state = "holiday";
      reason = holidayName;
    } else if (isPastSlot(date, time)) {
      state = "past";
    } else if (!withinWindow) {
      state = "outside_booking_window";
    } else if (wholeDayBlock || blockByTime.has(time)) {
      state = "blocked";
      reason = opts.role === "admin" ? (blockByTime.get(time)?.reason ?? (wholeDayBlock ? blocks.find((b) => b.booking_time == null)?.reason : undefined)) : undefined;
    } else if (bookingByTime.has(time)) {
      state = "booked";
    }
    const booking = bookingByTime.get(time);
    return {
      time,
      state,
      available: state === "available",
      reason,
      bookingId: opts.role === "admin" ? booking?.id ?? null : null,
      customerName: opts.role === "admin" ? booking?.customer_name ?? null : null,
      registrationNumber: opts.role === "admin" ? booking?.registration_number ?? null : null,
      priceCents: opts.role === "admin" ? booking?.price_cents ?? null : null,
    };
  });

  return { date, holiday: holidayName ?? null, slots };
}



export async function createBooking(input: {
  actorId: string;
  userId: string;
  carId: string;
  bookingDate: string;
  bookingTime: string;
  notes?: string | null;
  isAdmin?: boolean;
}): Promise<BookingRow> {
  const isAdmin = Boolean(input.isAdmin);
  if (!isValidIsoDate(input.bookingDate)) fail(BOOKING_ERROR_CODES.INVALID_DATE, 400);
  if (!isWorkingSlot(input.bookingTime)) fail(BOOKING_ERROR_CODES.INVALID_SLOT, 400);
  if (isPastSlot(input.bookingDate, input.bookingTime)) {
    fail(BOOKING_ERROR_CODES.BOOKING_DATE_OUT_OF_RANGE);
  }

  return withTransaction(async (sql) => {
    await sql`select pg_advisory_xact_lock(hashtext(${`booking-user:${input.userId}`}))`;
    await sql`select pg_advisory_xact_lock(hashtext(${`booking-date:${input.bookingDate}`}))`;

    const profile = await ensureProfile(sql, input.userId);
    if (profile.banned && !isAdmin) fail(BOOKING_ERROR_CODES.CLIENT_BANNED, 403);
    if (!isAdmin && !profile.phone) fail(BOOKING_ERROR_CODES.PHONE_REQUIRED, 400);

    if (isPastSlot(input.bookingDate, input.bookingTime)) {
      fail(BOOKING_ERROR_CODES.BOOKING_DATE_OUT_OF_RANGE);
    }

    const closed = isClosedHolidayDate(input.bookingDate);
    const holidays = await sql<{ id: string }>`
      select id from holidays where date = ${input.bookingDate} and active = true limit 1
    `;
    if (holidays.length || closed.closed) fail(BOOKING_ERROR_CODES.HOLIDAY);

    const blocked = await sql<{ id: string }>`
      select id from blocked_slots
      where booking_date = ${input.bookingDate}
        and (booking_time = ${input.bookingTime}::time or booking_time is null)
      limit 1
    `;
    if (blocked.length) fail(BOOKING_ERROR_CODES.SLOT_BLOCKED);

    const cars = await sql<{
      id: string;
      user_id: string;
      category: string;
      make_id: string;
      model_id: string;
    }>`
      select c.id, c.user_id, c.category, c.make_id, c.model_id
      from cars c
      where c.id = ${input.carId}
      limit 1
    `;
    const car = cars[0];
    if (!car) fail(BOOKING_ERROR_CODES.CAR_NOT_FOUND, 404);
    if (car.user_id !== input.userId) fail(BOOKING_ERROR_CODES.CAR_NOT_OWNED, 403);

    const catalog = await sql<{ n: number }>`
      select count(*)::int as n
      from vehicle_models v
      join vehicle_makes m on m.id = v.make_id
      where v.id = ${car.model_id}
        and m.id = ${car.make_id}
        and v.active = true
        and m.active = true
    `;
    if ((catalog[0]?.n ?? 0) === 0) fail(BOOKING_ERROR_CODES.INVALID_VEHICLE_MODEL, 400);

    let lockedWindow: Awaited<ReturnType<typeof customerWindow>> | null = null;
    if (!isAdmin) {
      lockedWindow = await customerWindow(sql);
      if (
        daysBetween(lockedWindow.start, input.bookingDate) < 0 ||
        daysBetween(lockedWindow.start, input.bookingDate) > lockedWindow.windowDays
      ) {
        fail(BOOKING_ERROR_CODES.BOOKING_DATE_OUT_OF_RANGE);
      }
      const settings = await sql<SettingRow>`
        select key, value from app_settings
        where key in ('max_customer_bookings_in_window', 'max_customer_bookings_per_car_in_window')
      `;
      const maxTotal = settingNumber(settings, "max_customer_bookings_in_window", MAX_CUSTOMER_BOOKINGS);
      const maxCar = settingNumber(
        settings,
        "max_customer_bookings_per_car_in_window",
        MAX_CUSTOMER_BOOKINGS_PER_CAR,
      );
      const total = await sql<{ count: number }>`
        select count(*)::int as count from bookings
        where user_id = ${input.userId}
          and status in ('pending', 'confirmed')
          and booking_date between ${lockedWindow.start} and ${lockedWindow.end}
      `;
      if ((total[0]?.count ?? 0) >= maxTotal) fail(BOOKING_ERROR_CODES.BOOKING_LIMIT_REACHED);
      const perCar = await sql<{ count: number }>`
        select count(*)::int as count from bookings
        where user_id = ${input.userId}
          and car_id = ${input.carId}
          and status in ('pending', 'confirmed')
          and booking_date between ${lockedWindow.start} and ${lockedWindow.end}
      `;
      if ((perCar[0]?.count ?? 0) >= maxCar) fail(BOOKING_ERROR_CODES.CAR_BOOKING_LIMIT_REACHED);
    }

    const priceCents = getPriceCents(car.category);
    try {
      const inserted = await sql<{
        id: string;
        user_id: string;
        car_id: string;
        booking_date: string;
        booking_time: string;
        price_cents: number;
        status: BookingStatus;
        notes: string | null;
        created_at: string;
        updated_at: string;
      }>`
        insert into bookings (user_id, car_id, booking_date, booking_time, price_cents, status, notes)
        values (
          ${input.userId},
          ${input.carId},
          ${input.bookingDate}::date,
          ${input.bookingTime}::time,
          ${priceCents},
          'confirmed',
          ${input.notes ?? null}
        )
        returning id, user_id, car_id, booking_date, booking_time, price_cents, status, notes, created_at, updated_at
      `;
      const row = inserted[0]!;
      await writeAudit(sql, {
        actorId: input.actorId,
        action: isAdmin ? "booking.created_admin" : "booking.created",
        targetId: row.id,
        metadata: {
          userId: row.user_id,
          carId: row.car_id,
          bookingDate: toDateString(row.booking_date),
          bookingTime: toTimeString(row.booking_time),
          priceCents: row.price_cents,
        },
      });
      return {
        id: row.id,
        userId: row.user_id,
        carId: row.car_id,
        bookingDate: toDateString(row.booking_date),
        bookingTime: toTimeString(row.booking_time),
        priceCents: row.price_cents,
        status: row.status,
        notes: row.notes,
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
      };
    } catch (error) {
      if (isUniqueViolation(error)) fail(BOOKING_ERROR_CODES.SLOT_UNAVAILABLE);
      throw error;
    }
  });
}

export async function listMyBookings(userId: string): Promise<BookingRow[]> {
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    user_id: string;
    car_id: string;
    booking_date: string;
    booking_time: string;
    price_cents: number;
    status: BookingStatus;
    notes: string | null;
    created_at: string;
    updated_at: string;
    make_name: string;
    model_name: string;
    registration_number: string;
    category: string;
  }>`
    select
      b.id, b.user_id, b.car_id, b.booking_date, b.booking_time, b.price_cents,
      b.status, b.notes, b.created_at, b.updated_at,
      c.make_name, c.model_name, c.registration_number, c.category
    from bookings b
    join cars c on c.id = b.car_id
    where b.user_id = ${userId}
    order by b.booking_date desc, b.booking_time desc
  `;
  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    carId: row.car_id,
    bookingDate: toDateString(row.booking_date),
    bookingTime: toTimeString(row.booking_time),
    priceCents: row.price_cents,
    status: row.status,
    notes: row.notes,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    makeName: row.make_name,
    modelName: row.model_name,
    registrationNumber: row.registration_number,
    category: row.category,
  }));
}

export async function cancelCustomerBooking(userId: string, bookingId: string): Promise<BookingRow> {
  return withTransaction(async (sql) => {
    await sql`select pg_advisory_xact_lock(hashtext(${`booking-user:${userId}`}))`;
    const snapshot = await sql<{
      id: string;
      user_id: string;
      car_id: string;
      booking_date: string;
      booking_time: string;
      price_cents: number;
      status: BookingStatus;
      notes: string | null;
      created_at: string;
      updated_at: string;
    }>`
      select id, user_id, car_id, booking_date, booking_time, price_cents, status, notes, created_at, updated_at
      from bookings
      where id = ${bookingId}
      limit 1
    `;
    const existing = snapshot[0];
    if (
      !existing ||
      existing.user_id !== userId ||
      !ACTIVE_BOOKING_STATUSES.includes(existing.status as (typeof ACTIVE_BOOKING_STATUSES)[number])
    ) {
      fail(BOOKING_ERROR_CODES.BOOKING_NOT_FOUND_OR_NOT_CANCELLABLE, 404);
    }
    const bookingDate = toDateString(existing.booking_date);
    const bookingTime = toTimeString(existing.booking_time);
    await sql`select pg_advisory_xact_lock(hashtext(${`booking-date:${bookingDate}`}))`;
    if (isPastSlot(bookingDate, bookingTime)) {
      fail(BOOKING_ERROR_CODES.BOOKING_NOT_FOUND_OR_NOT_CANCELLABLE, 404);
    }
    const rows = await sql<{
      id: string;
      user_id: string;
      car_id: string;
      booking_date: string;
      booking_time: string;
      price_cents: number;
      status: BookingStatus;
      notes: string | null;
      created_at: string;
      updated_at: string;
    }>`
      update bookings
      set status = 'cancelled_customer', updated_at = now()
      where id = ${bookingId}
        and user_id = ${userId}
        and status in ('pending', 'confirmed')
      returning id, user_id, car_id, booking_date, booking_time, price_cents, status, notes, created_at, updated_at
    `;
    if (!rows[0]) fail(BOOKING_ERROR_CODES.BOOKING_NOT_FOUND_OR_NOT_CANCELLABLE, 404);
    await writeAudit(sql, {
      actorId: userId,
      action: "booking.cancelled_customer",
      targetId: bookingId,
      metadata: { previousStatus: existing.status },
    });
    const row = rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      carId: row.car_id,
      bookingDate: toDateString(row.booking_date),
      bookingTime: toTimeString(row.booking_time),
      priceCents: row.price_cents,
      status: row.status,
      notes: row.notes,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  });
}

export async function listAdminBookings(): Promise<BookingRow[]> {
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    user_id: string;
    car_id: string;
    booking_date: string;
    booking_time: string;
    price_cents: number;
    status: BookingStatus;
    notes: string | null;
    created_at: string;
    updated_at: string;
    make_name: string;
    model_name: string;
    registration_number: string;
    category: string;
    customer_name: string | null;
    customer_email: string | null;
    customer_phone: string | null;
  }>`
    select
      b.id, b.user_id, b.car_id, b.booking_date, b.booking_time, b.price_cents,
      b.status, b.notes, b.created_at, b.updated_at,
      c.make_name, c.model_name, c.registration_number, c.category,
      u.name as customer_name, u.email as customer_email, p.phone as customer_phone
    from bookings b
    join cars c on c.id = b.car_id
    left join "user" u on u.id = b.user_id
    left join profiles p on p.user_id = b.user_id
    order by b.booking_date desc, b.booking_time desc
  `;
  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    carId: row.car_id,
    bookingDate: toDateString(row.booking_date),
    bookingTime: toTimeString(row.booking_time),
    priceCents: row.price_cents,
    status: row.status,
    notes: row.notes,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    makeName: row.make_name,
    modelName: row.model_name,
    registrationNumber: row.registration_number,
    category: row.category,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
  }));
}

export async function adminUpdateBooking(input: {
  actorId: string;
  bookingId: string;
  bookingDate?: string;
  bookingTime?: string;
  carId?: string;
  status?: BookingStatus;
  notes?: string | null;
}): Promise<BookingRow> {
  return withTransaction(async (sql) => {
    const current = await sql<{
      id: string;
      user_id: string;
      car_id: string;
      booking_date: string;
      booking_time: string;
      price_cents: number;
      status: BookingStatus;
      notes: string | null;
      created_at: string;
      updated_at: string;
    }>`
      select id, user_id, car_id, booking_date, booking_time, price_cents, status, notes, created_at, updated_at
      from bookings where id = ${input.bookingId} limit 1
    `;
    const booking = current[0];
    if (!booking) fail(BOOKING_ERROR_CODES.CAR_NOT_FOUND, 404);

    const nextDate = input.bookingDate ?? toDateString(booking.booking_date);
    const nextTime = input.bookingTime ?? toTimeString(booking.booking_time);
    const nextCarId = input.carId ?? booking.car_id;
    const nextStatus = input.status ?? booking.status;
    const nextNotes = input.notes === undefined ? booking.notes : input.notes;

    await sql`select pg_advisory_xact_lock(hashtext(${`booking-date:${nextDate}`}))`;

    if (isValidIsoDate(nextDate) && isWorkingSlot(nextTime)) {
      const closed = isClosedHolidayDate(nextDate);
      const holidays = await sql<{ id: string }>`
        select id from holidays where date = ${nextDate} and active = true limit 1
      `;
      if (
        (holidays.length || closed.closed) &&
        ACTIVE_BOOKING_STATUSES.includes(nextStatus as (typeof ACTIVE_BOOKING_STATUSES)[number])
      ) {
        fail(BOOKING_ERROR_CODES.HOLIDAY);
      }
      const blocked = await sql<{ id: string }>`
        select id from blocked_slots
        where booking_date = ${nextDate}
          and (booking_time = ${nextTime}::time or booking_time is null)
        limit 1
      `;
      if (
        blocked.length &&
        ACTIVE_BOOKING_STATUSES.includes(nextStatus as (typeof ACTIVE_BOOKING_STATUSES)[number])
      ) {
        fail(BOOKING_ERROR_CODES.SLOT_BLOCKED);
      }
    }

    const cars = await sql<{ id: string; user_id: string; category: string }>`
      select id, user_id, category from cars where id = ${nextCarId} limit 1
    `;
    const car = cars[0];
    if (!car || car.user_id !== booking.user_id) fail(BOOKING_ERROR_CODES.CAR_NOT_OWNED, 403);
    const priceCents = getPriceCents(car.category);

    try {
      const rows = await sql<{
        id: string;
        user_id: string;
        car_id: string;
        booking_date: string;
        booking_time: string;
        price_cents: number;
        status: BookingStatus;
        notes: string | null;
        created_at: string;
        updated_at: string;
      }>`
        update bookings
        set
          booking_date = ${nextDate}::date,
          booking_time = ${nextTime}::time,
          car_id = ${nextCarId},
          status = ${nextStatus},
          notes = ${nextNotes},
          price_cents = ${priceCents},
          updated_at = now()
        where id = ${input.bookingId}
        returning id, user_id, car_id, booking_date, booking_time, price_cents, status, notes, created_at, updated_at
      `;
      const row = rows[0]!;
      await writeAudit(sql, {
        actorId: input.actorId,
        action: "booking.updated",
        targetId: row.id,
        metadata: { previousStatus: booking.status, status: row.status },
      });
      return {
        id: row.id,
        userId: row.user_id,
        carId: row.car_id,
        bookingDate: toDateString(row.booking_date),
        bookingTime: toTimeString(row.booking_time),
        priceCents: row.price_cents,
        status: row.status,
        notes: row.notes,
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
      };
    } catch (error) {
      if (isUniqueViolation(error)) fail(BOOKING_ERROR_CODES.SLOT_UNAVAILABLE);
      throw error;
    }
  });
}

export async function listBlockedSlots() {
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    booking_date: string;
    booking_time: string | null;
    reason: string;
    created_at: string;
  }>`
    select id, booking_date, booking_time, reason, created_at
    from blocked_slots
    order by booking_date desc, booking_time asc nulls first
  `;
  return rows.map((row) => ({
    id: row.id,
    bookingDate: toDateString(row.booking_date),
    bookingTime: row.booking_time ? toTimeString(row.booking_time) : null,
    reason: row.reason,
    createdAt: String(row.created_at),
  }));
}

export async function createBlockedSlot(input: {
  actorId: string;
  bookingDate: string;
  bookingTime: string | null;
  reason: string;
}) {
  if (!isValidIsoDate(input.bookingDate)) fail(BOOKING_ERROR_CODES.INVALID_DATE, 400);
  if (input.bookingTime && !isWorkingSlot(input.bookingTime)) {
    fail(BOOKING_ERROR_CODES.INVALID_SLOT, 400);
  }
  return withTransaction(async (sql) => {
    await sql`select pg_advisory_xact_lock(hashtext(${`booking-date:${input.bookingDate}`}))`;
    try {
      const rows = await sql<{
        id: string;
        booking_date: string;
        booking_time: string | null;
        reason: string;
      }>`
        insert into blocked_slots (booking_date, booking_time, reason, created_by)
        values (
          ${input.bookingDate}::date,
          ${input.bookingTime ? input.bookingTime : null}::time,
          ${input.reason.trim()},
          ${input.actorId}
        )
        returning id, booking_date, booking_time, reason
      `;
      const row = rows[0]!;
      await writeAudit(sql, {
        actorId: input.actorId,
        action: "blocked_slot.created",
        targetId: row.id,
        metadata: {
          bookingDate: toDateString(row.booking_date),
          bookingTime: row.booking_time ? toTimeString(row.booking_time) : null,
          reason: row.reason,
        },
      });
      return {
        id: row.id,
        bookingDate: toDateString(row.booking_date),
        bookingTime: row.booking_time ? toTimeString(row.booking_time) : null,
        reason: row.reason,
      };
    } catch (error) {
      if (isUniqueViolation(error)) {
        fail(uniqueCode(error, BOOKING_ERROR_CODES.SLOT_UNAVAILABLE), 409);
      }
      throw error;
    }
  });
}

export async function deleteBlockedSlot(actorId: string, id: string) {
  await withTransaction(async (sql) => {
    const deleted = await sql<{ id: string }>`
      delete from blocked_slots where id = ${id} returning id
    `;
    if (!deleted[0]) fail(BOOKING_ERROR_CODES.CAR_NOT_FOUND, 404);
    await writeAudit(sql, {
      actorId,
      action: "blocked_slot.deleted",
      targetId: id,
    });
  });
}

export async function listClients() {
  const sql = await getSql();
  const rows = await sql<{
    user_id: string;
    phone: string | null;
    role: "customer" | "admin";
    banned: boolean;
    ban_reason: string | null;
    name: string | null;
    email: string | null;
    created_at: string;
  }>`
    select p.user_id, p.phone, p.role, p.banned, p.ban_reason, u.name, u.email, p.created_at
    from profiles p
    left join "user" u on u.id = p.user_id
    order by p.created_at desc
  `;
  return rows.map((row) => ({
    userId: row.user_id,
    phone: row.phone,
    role: row.role,
    banned: row.banned,
    banReason: row.ban_reason,
    name: row.name,
    email: row.email,
  }));
}

export async function setBanned(input: {
  actorId: string;
  userId: string;
  banned: boolean;
  reason?: string;
}) {
  return withTransaction(async (sql) => {
    await sql`select pg_advisory_xact_lock(hashtext(${`booking-user:${input.userId}`}))`;
    await ensureProfile(sql, input.userId);
    if (input.banned) {
      const reason = (input.reason ?? "Bloķēts").trim().slice(0, 300);
      await sql`
        update profiles
        set banned = true,
            ban_reason = ${reason},
            banned_at = now(),
            updated_at = now()
        where user_id = ${input.userId}
      `;
    } else {
      await sql`
        update profiles
        set banned = false,
            ban_reason = null,
            banned_at = null,
            updated_at = now()
        where user_id = ${input.userId}
      `;
    }
    await writeAudit(sql, {
      actorId: input.actorId,
      action: input.banned ? "user.banned" : "user.unbanned",
      targetId: input.userId,
      metadata: { reason: input.reason ?? null },
    });
  });
}

export async function listHolidays() {
  const sql = await getSql();
  const rows = await sql<{ id: string; date: string; name: string; active: boolean }>`
    select id, date, name, active from holidays order by date
  `;
  return rows.map((row) => ({
    id: row.id,
    date: toDateString(row.date),
    name: row.name,
    active: row.active,
  }));
}

export async function listAudit(limit = 80) {
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    actor_id: string | null;
    action: string;
    target_id: string | null;
    metadata: Record<string, string | number | boolean | null> | null;
    created_at: string;
    actor_name: string | null;
  }>`
    select a.id, a.actor_id, a.action, a.target_id, a.metadata, a.created_at, u.name as actor_name
    from audit_logs a
    left join "user" u on u.id = a.actor_id
    order by a.created_at desc
    limit ${limit}
  `;
  return rows.map((row) => ({
    id: row.id,
    actorId: row.actor_id,
    actorName: row.actor_name,
    action: row.action,
    targetId: row.target_id,
    metadata: JSON.stringify(row.metadata ?? {}),
    createdAt: String(row.created_at),
  }));
}

export async function quotePriceForCar(userId: string, carId: string) {
  const sql = await getSql();
  const rows = await sql<{ category: string; user_id: string }>`
    select category, user_id from cars where id = ${carId} limit 1
  `;
  const car = rows[0];
  if (!car) fail(BOOKING_ERROR_CODES.CAR_NOT_FOUND, 404);
  if (car.user_id !== userId) fail(BOOKING_ERROR_CODES.CAR_NOT_OWNED, 403);
  return { category: car.category, priceCents: getPriceCents(car.category) };
}


