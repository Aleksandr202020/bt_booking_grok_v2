import { i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { c as fail, i as BOOKING_STATUSES, o as WORKING_SLOTS, r as BOOKING_ERROR_CODES, s as authMiddleware, t as ACTIVE_BOOKING_STATUSES } from "./middleware-CDYsiKlx.mjs";
import { cn as _enum, dn as boolean, gn as object, yn as string } from "../_libs/@better-auth/core+[...].mjs";
import { a as getRigaNowParts, c as isValidIsoDate, d as toTimeString, l as isWorkingSlot, n as daysBetween, o as isClosedHolidayDate, s as isPastSlot, t as addCalendarDays, u as toDateString } from "./dates-DHkzvHRL.mjs";
import { i as getSql, r as getPglite, t as dbSource } from "./db-BLIjsj9g.mjs";
import { n as getPriceCents, r as isCarCategory } from "./pricing-D2q3Uz5_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/functions-DAOu1Yq9.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var OID_INT8 = 20;
var OID_DATE = 1082;
var OID_INTERVAL = 1186;
function toSql(run) {
	const sql = (async (strings, ...values) => {
		let text = strings[0] ?? "";
		for (let i = 0; i < values.length; i += 1) text += `$${i + 1}${strings[i + 1] ?? ""}`;
		return run(text, values);
	});
	sql.query = (text, params = []) => run(text, params);
	return sql;
}
function isUniqueViolation(error) {
	if (!error || typeof error !== "object") return false;
	const e = error;
	return e.code === "23505" || e.code === "23514" || /unique|duplicate|WHOLE_DAY_BLOCK|SLOT_BLOCK_CONFLICT/i.test(e.message ?? "");
}
function uniqueCode(error, fallback) {
	const msg = error && typeof error === "object" ? String(error.message ?? "") : "";
	if (/WHOLE_DAY_BLOCK/i.test(msg)) return "WHOLE_DAY_BLOCK_CONFLICT";
	if (/SLOT_BLOCK_CONFLICT/i.test(msg)) return "SLOT_BLOCK_CONFLICT_WITH_WHOLE_DAY";
	return fallback;
}
async function withTransaction(fn) {
	if (dbSource === "pglite") return (await getPglite()).transaction(async (tx) => {
		return fn(toSql(async (text, params) => {
			return (await tx.query(text, params)).rows;
		}));
	});
	const connectionString = process.env.DATABASE_URL?.trim();
	if (!connectionString) throw new Error("DATABASE_URL is not set");
	const { Client, types } = await import("../_libs/pg.mjs").then((n) => n.n);
	types.setTypeParser(OID_INT8, Number);
	types.setTypeParser(OID_DATE, (v) => v);
	types.setTypeParser(OID_INTERVAL, (v) => v);
	const client = new Client({ connectionString });
	await client.connect();
	try {
		await client.query("begin");
		const out = await fn(toSql(async (text, params) => {
			return (await client.query(text, params)).rows;
		}));
		await client.query("commit");
		return out;
	} catch (error) {
		try {
			await client.query("rollback");
		} catch {}
		throw error;
	} finally {
		await client.end();
	}
}
function mapProfile(row, user) {
	return {
		userId: row.user_id,
		phone: row.phone,
		role: row.role,
		banned: row.banned,
		banReason: row.ban_reason,
		name: user?.name ?? null,
		email: user?.email ?? null
	};
}
async function ensureProfile(sql, userId) {
	await sql`select pg_advisory_xact_lock(hashtext('bt-booking:profile-bootstrap'))`;
	const existing = await sql`
    select user_id, phone, role, banned, ban_reason
    from profiles
    where user_id = ${userId}
    limit 1
  `;
	if (existing[0]) return existing[0];
	return (await sql`
    insert into profiles (user_id, role)
    values (${userId}, ${((await sql`
    select count(*)::int as n from profiles where role = 'admin'
  `)[0]?.n ?? 0) === 0 ? "admin" : "customer"})
    on conflict (user_id) do update set updated_at = profiles.updated_at
    returning user_id, phone, role, banned, ban_reason
  `)[0];
}
async function writeAudit(sql, input) {
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
async function loadUserIdentity(sql, userId) {
	return (await sql`
    select name, email from "user" where id = ${userId} limit 1
  `)[0] ?? {
		name: null,
		email: null
	};
}
async function getProfileForUser(userId) {
	return withTransaction(async (sql) => {
		return mapProfile(await ensureProfile(sql, userId), await loadUserIdentity(sql, userId));
	});
}
async function requireAdmin(userId) {
	const profile = await getProfileForUser(userId);
	if (profile.role !== "admin") fail(BOOKING_ERROR_CODES.FORBIDDEN, 403);
	return profile;
}
async function updatePhone(userId, phone) {
	return withTransaction(async (sql) => {
		await ensureProfile(sql, userId);
		const rows = await sql`
      update profiles
      set phone = ${phone}, updated_at = now()
      where user_id = ${userId}
      returning user_id, phone, role, banned, ban_reason
    `;
		const identity = await loadUserIdentity(sql, userId);
		await writeAudit(sql, {
			actorId: userId,
			action: "profile.phone_updated",
			targetId: userId
		});
		return mapProfile(rows[0], identity);
	});
}
function settingNumber(rows, key, fallback) {
	const raw = rows.find((r) => r.key === key)?.value;
	return typeof raw === "number" ? raw : fallback;
}
async function customerWindow(sql) {
	const windowDays = settingNumber(await sql`
    select key, value from app_settings where key = 'customer_booking_window_days'
  `, "customer_booking_window_days", 30);
	const { date: today } = getRigaNowParts();
	return {
		start: today,
		end: addCalendarDays(today, windowDays),
		windowDays
	};
}
async function listCatalog() {
	const sql = await getSql();
	return {
		makes: await sql`
    select id, name from vehicle_makes where active = true order by name
  `,
		models: (await sql`
    select id, make_id, name, category
    from vehicle_models
    where active = true
    order by name
  `).map((m) => ({
			id: m.id,
			makeId: m.make_id,
			name: m.name,
			category: m.category
		}))
	};
}
function mapCar(row) {
	return {
		id: row.id,
		userId: row.user_id,
		makeId: row.make_id,
		modelId: row.model_id,
		makeName: row.make_name,
		modelName: row.model_name,
		registrationNumber: row.registration_number,
		category: row.category,
		createdAt: String(row.created_at)
	};
}
async function listCarsForUser(userId) {
	return (await (await getSql())`
    select id, user_id, make_id, model_id, make_name, model_name, registration_number, category, created_at
    from cars
    where user_id = ${userId}
    order by created_at desc
  `).map(mapCar);
}
async function createCar(input) {
	const registration = input.registrationNumber.trim().toUpperCase().replace(/\s+/g, "");
	return withTransaction(async (sql) => {
		await sql`select pg_advisory_xact_lock(hashtext('bt-booking:vehicle-catalog'))`;
		if ((await ensureProfile(sql, input.userId)).banned) fail(BOOKING_ERROR_CODES.CLIENT_BANNED, 403);
		const model = (await sql`
      select v.id, v.make_id, v.name, v.category, m.name as make_name
      from vehicle_models v
      join vehicle_makes m on m.id = v.make_id
      where v.id = ${input.modelId}
        and m.id = ${input.makeId}
        and v.active = true
        and m.active = true
      limit 1
    `)[0];
		if (!model || !isCarCategory(model.category)) fail(BOOKING_ERROR_CODES.INVALID_VEHICLE_MODEL, 400);
		await sql`select pg_advisory_xact_lock(hashtext(${`booking-user:${input.userId}`}))`;
		try {
			const car = mapCar((await sql`
        insert into cars (
          user_id, make_id, model_id, make_name, model_name, registration_number, category
        )
        values (
          ${input.userId}, ${model.make_id}, ${model.id}, ${model.make_name},
          ${model.name}, ${registration}, ${model.category}
        )
        returning id, user_id, make_id, model_id, make_name, model_name, registration_number, category, created_at
      `)[0]);
			await writeAudit(sql, {
				actorId: input.userId,
				action: "car.created",
				targetId: car.id,
				metadata: {
					make: car.makeName,
					model: car.modelName,
					registrationNumber: car.registrationNumber,
					category: car.category
				}
			});
			return car;
		} catch (error) {
			if (isUniqueViolation(error)) fail(BOOKING_ERROR_CODES.REGISTRATION_ALREADY_EXISTS, 409);
			throw error;
		}
	});
}
async function deleteCar(userId, carId) {
	await withTransaction(async (sql) => {
		if ((await ensureProfile(sql, userId)).banned) {}
		if (((await sql`
      select count(*)::int as n
      from bookings
      where car_id = ${carId}
        and user_id = ${userId}
        and status in ('pending', 'confirmed')
    `)[0]?.n ?? 0) > 0) fail(BOOKING_ERROR_CODES.CAR_HAS_ACTIVE_BOOKING, 409);
		if (!(await sql`
      delete from cars
      where id = ${carId} and user_id = ${userId}
      returning id
    `)[0]) fail(BOOKING_ERROR_CODES.CAR_NOT_FOUND, 404);
		await writeAudit(sql, {
			actorId: userId,
			action: "car.deleted",
			targetId: carId
		});
	});
}
async function getSlotAvailability(date, opts) {
	if (!isValidIsoDate(date)) fail(BOOKING_ERROR_CODES.INVALID_DATE, 400);
	const sql = await getSql();
	const [bookings, blocks, holidays] = await Promise.all([
		sql`
      select
        b.booking_time, b.id, b.user_id, b.car_id, b.status, b.price_cents,
        u.name as customer_name, c.registration_number
      from bookings b
      left join "user" u on u.id = b.user_id
      left join cars c on c.id = b.car_id
      where b.booking_date = ${date}
        and b.status in ('pending', 'confirmed')
    `,
		sql`
      select booking_time, reason from blocked_slots where booking_date = ${date}
    `,
		sql`
      select name from holidays where date = ${date} and active = true limit 1
    `
	]);
	const closed = isClosedHolidayDate(date);
	const holidayName = holidays[0]?.name ?? (closed.closed ? closed.name : null);
	const wholeDayBlock = blocks.some((row) => row.booking_time == null);
	const withinWindow = opts.role === "admin" ? true : (() => {
		const { date: today } = getRigaNowParts();
		const delta = daysBetween(today, date);
		return delta >= 0 && delta <= 30;
	})();
	const bookingByTime = new Map(bookings.map((row) => [toTimeString(row.booking_time), row]));
	const blockByTime = new Map(blocks.filter((row) => row.booking_time != null).map((row) => [toTimeString(row.booking_time), row]));
	const slots = WORKING_SLOTS.map((time) => {
		let state = "available";
		let reason;
		if (holidayName) {
			state = "holiday";
			reason = holidayName;
		} else if (isPastSlot(date, time)) state = "past";
		else if (!withinWindow) state = "outside_booking_window";
		else if (wholeDayBlock || blockByTime.has(time)) {
			state = "blocked";
			reason = opts.role === "admin" ? blockByTime.get(time)?.reason ?? (wholeDayBlock ? blocks.find((b) => b.booking_time == null)?.reason : void 0) : void 0;
		} else if (bookingByTime.has(time)) state = "booked";
		const booking = bookingByTime.get(time);
		return {
			time,
			state,
			available: state === "available",
			reason,
			bookingId: opts.role === "admin" ? booking?.id ?? null : null,
			customerName: opts.role === "admin" ? booking?.customer_name ?? null : null,
			registrationNumber: opts.role === "admin" ? booking?.registration_number ?? null : null,
			priceCents: opts.role === "admin" ? booking?.price_cents ?? null : null
		};
	});
	return {
		date,
		holiday: holidayName ?? null,
		slots
	};
}
async function createBooking(input) {
	const isAdmin = Boolean(input.isAdmin);
	if (!isValidIsoDate(input.bookingDate)) fail(BOOKING_ERROR_CODES.INVALID_DATE, 400);
	if (!isWorkingSlot(input.bookingTime)) fail(BOOKING_ERROR_CODES.INVALID_SLOT, 400);
	if (isPastSlot(input.bookingDate, input.bookingTime)) fail(BOOKING_ERROR_CODES.BOOKING_DATE_OUT_OF_RANGE);
	return withTransaction(async (sql) => {
		await sql`select pg_advisory_xact_lock(hashtext(${`booking-user:${input.userId}`}))`;
		await sql`select pg_advisory_xact_lock(hashtext(${`booking-date:${input.bookingDate}`}))`;
		const profile = await ensureProfile(sql, input.userId);
		if (profile.banned && !isAdmin) fail(BOOKING_ERROR_CODES.CLIENT_BANNED, 403);
		if (!isAdmin && !profile.phone) fail(BOOKING_ERROR_CODES.PHONE_REQUIRED, 400);
		if (isPastSlot(input.bookingDate, input.bookingTime)) fail(BOOKING_ERROR_CODES.BOOKING_DATE_OUT_OF_RANGE);
		const closed = isClosedHolidayDate(input.bookingDate);
		if ((await sql`
      select id from holidays where date = ${input.bookingDate} and active = true limit 1
    `).length || closed.closed) fail(BOOKING_ERROR_CODES.HOLIDAY);
		if ((await sql`
      select id from blocked_slots
      where booking_date = ${input.bookingDate}
        and (booking_time = ${input.bookingTime}::time or booking_time is null)
      limit 1
    `).length) fail(BOOKING_ERROR_CODES.SLOT_BLOCKED);
		const car = (await sql`
      select c.id, c.user_id, c.category, c.make_id, c.model_id
      from cars c
      where c.id = ${input.carId}
      limit 1
    `)[0];
		if (!car) fail(BOOKING_ERROR_CODES.CAR_NOT_FOUND, 404);
		if (car.user_id !== input.userId) fail(BOOKING_ERROR_CODES.CAR_NOT_OWNED, 403);
		if (((await sql`
      select count(*)::int as n
      from vehicle_models v
      join vehicle_makes m on m.id = v.make_id
      where v.id = ${car.model_id}
        and m.id = ${car.make_id}
        and v.active = true
        and m.active = true
    `)[0]?.n ?? 0) === 0) fail(BOOKING_ERROR_CODES.INVALID_VEHICLE_MODEL, 400);
		let lockedWindow = null;
		if (!isAdmin) {
			lockedWindow = await customerWindow(sql);
			if (daysBetween(lockedWindow.start, input.bookingDate) < 0 || daysBetween(lockedWindow.start, input.bookingDate) > lockedWindow.windowDays) fail(BOOKING_ERROR_CODES.BOOKING_DATE_OUT_OF_RANGE);
			const settings = await sql`
        select key, value from app_settings
        where key in ('max_customer_bookings_in_window', 'max_customer_bookings_per_car_in_window')
      `;
			const maxTotal = settingNumber(settings, "max_customer_bookings_in_window", 3);
			const maxCar = settingNumber(settings, "max_customer_bookings_per_car_in_window", 2);
			if (((await sql`
        select count(*)::int as count from bookings
        where user_id = ${input.userId}
          and status in ('pending', 'confirmed')
          and booking_date between ${lockedWindow.start} and ${lockedWindow.end}
      `)[0]?.count ?? 0) >= maxTotal) fail(BOOKING_ERROR_CODES.BOOKING_LIMIT_REACHED);
			if (((await sql`
        select count(*)::int as count from bookings
        where user_id = ${input.userId}
          and car_id = ${input.carId}
          and status in ('pending', 'confirmed')
          and booking_date between ${lockedWindow.start} and ${lockedWindow.end}
      `)[0]?.count ?? 0) >= maxCar) fail(BOOKING_ERROR_CODES.CAR_BOOKING_LIMIT_REACHED);
		}
		const priceCents = getPriceCents(car.category);
		try {
			const row = (await sql`
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
      `)[0];
			await writeAudit(sql, {
				actorId: input.actorId,
				action: isAdmin ? "booking.created_admin" : "booking.created",
				targetId: row.id,
				metadata: {
					userId: row.user_id,
					carId: row.car_id,
					bookingDate: toDateString(row.booking_date),
					bookingTime: toTimeString(row.booking_time),
					priceCents: row.price_cents
				}
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
				updatedAt: String(row.updated_at)
			};
		} catch (error) {
			if (isUniqueViolation(error)) fail(BOOKING_ERROR_CODES.SLOT_UNAVAILABLE);
			throw error;
		}
	});
}
async function listMyBookings(userId) {
	return (await (await getSql())`
    select
      b.id, b.user_id, b.car_id, b.booking_date, b.booking_time, b.price_cents,
      b.status, b.notes, b.created_at, b.updated_at,
      c.make_name, c.model_name, c.registration_number, c.category
    from bookings b
    join cars c on c.id = b.car_id
    where b.user_id = ${userId}
    order by b.booking_date desc, b.booking_time desc
  `).map((row) => ({
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
		category: row.category
	}));
}
async function cancelCustomerBooking(userId, bookingId) {
	return withTransaction(async (sql) => {
		await sql`select pg_advisory_xact_lock(hashtext(${`booking-user:${userId}`}))`;
		const existing = (await sql`
      select id, user_id, car_id, booking_date, booking_time, price_cents, status, notes, created_at, updated_at
      from bookings
      where id = ${bookingId}
      limit 1
    `)[0];
		if (!existing || existing.user_id !== userId || !ACTIVE_BOOKING_STATUSES.includes(existing.status)) fail(BOOKING_ERROR_CODES.BOOKING_NOT_FOUND_OR_NOT_CANCELLABLE, 404);
		const bookingDate = toDateString(existing.booking_date);
		const bookingTime = toTimeString(existing.booking_time);
		await sql`select pg_advisory_xact_lock(hashtext(${`booking-date:${bookingDate}`}))`;
		if (isPastSlot(bookingDate, bookingTime)) fail(BOOKING_ERROR_CODES.BOOKING_NOT_FOUND_OR_NOT_CANCELLABLE, 404);
		const rows = await sql`
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
			metadata: { previousStatus: existing.status }
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
			updatedAt: String(row.updated_at)
		};
	});
}
async function listAdminBookings() {
	return (await (await getSql())`
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
  `).map((row) => ({
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
		customerPhone: row.customer_phone
	}));
}
async function adminUpdateBooking(input) {
	return withTransaction(async (sql) => {
		const booking = (await sql`
      select id, user_id, car_id, booking_date, booking_time, price_cents, status, notes, created_at, updated_at
      from bookings where id = ${input.bookingId} limit 1
    `)[0];
		if (!booking) fail(BOOKING_ERROR_CODES.CAR_NOT_FOUND, 404);
		const nextDate = input.bookingDate ?? toDateString(booking.booking_date);
		const nextTime = input.bookingTime ?? toTimeString(booking.booking_time);
		const nextCarId = input.carId ?? booking.car_id;
		const nextStatus = input.status ?? booking.status;
		const nextNotes = input.notes === void 0 ? booking.notes : input.notes;
		await sql`select pg_advisory_xact_lock(hashtext(${`booking-date:${nextDate}`}))`;
		if (isValidIsoDate(nextDate) && isWorkingSlot(nextTime)) {
			const closed = isClosedHolidayDate(nextDate);
			if (((await sql`
        select id from holidays where date = ${nextDate} and active = true limit 1
      `).length || closed.closed) && ACTIVE_BOOKING_STATUSES.includes(nextStatus)) fail(BOOKING_ERROR_CODES.HOLIDAY);
			if ((await sql`
        select id from blocked_slots
        where booking_date = ${nextDate}
          and (booking_time = ${nextTime}::time or booking_time is null)
        limit 1
      `).length && ACTIVE_BOOKING_STATUSES.includes(nextStatus)) fail(BOOKING_ERROR_CODES.SLOT_BLOCKED);
		}
		const car = (await sql`
      select id, user_id, category from cars where id = ${nextCarId} limit 1
    `)[0];
		if (!car || car.user_id !== booking.user_id) fail(BOOKING_ERROR_CODES.CAR_NOT_OWNED, 403);
		const priceCents = getPriceCents(car.category);
		try {
			const row = (await sql`
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
      `)[0];
			await writeAudit(sql, {
				actorId: input.actorId,
				action: "booking.updated",
				targetId: row.id,
				metadata: {
					previousStatus: booking.status,
					status: row.status
				}
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
				updatedAt: String(row.updated_at)
			};
		} catch (error) {
			if (isUniqueViolation(error)) fail(BOOKING_ERROR_CODES.SLOT_UNAVAILABLE);
			throw error;
		}
	});
}
async function listBlockedSlots() {
	return (await (await getSql())`
    select id, booking_date, booking_time, reason, created_at
    from blocked_slots
    order by booking_date desc, booking_time asc nulls first
  `).map((row) => ({
		id: row.id,
		bookingDate: toDateString(row.booking_date),
		bookingTime: row.booking_time ? toTimeString(row.booking_time) : null,
		reason: row.reason,
		createdAt: String(row.created_at)
	}));
}
async function createBlockedSlot(input) {
	if (!isValidIsoDate(input.bookingDate)) fail(BOOKING_ERROR_CODES.INVALID_DATE, 400);
	if (input.bookingTime && !isWorkingSlot(input.bookingTime)) fail(BOOKING_ERROR_CODES.INVALID_SLOT, 400);
	return withTransaction(async (sql) => {
		await sql`select pg_advisory_xact_lock(hashtext(${`booking-date:${input.bookingDate}`}))`;
		try {
			const row = (await sql`
        insert into blocked_slots (booking_date, booking_time, reason, created_by)
        values (
          ${input.bookingDate}::date,
          ${input.bookingTime ? input.bookingTime : null}::time,
          ${input.reason.trim()},
          ${input.actorId}
        )
        returning id, booking_date, booking_time, reason
      `)[0];
			await writeAudit(sql, {
				actorId: input.actorId,
				action: "blocked_slot.created",
				targetId: row.id,
				metadata: {
					bookingDate: toDateString(row.booking_date),
					bookingTime: row.booking_time ? toTimeString(row.booking_time) : null,
					reason: row.reason
				}
			});
			return {
				id: row.id,
				bookingDate: toDateString(row.booking_date),
				bookingTime: row.booking_time ? toTimeString(row.booking_time) : null,
				reason: row.reason
			};
		} catch (error) {
			if (isUniqueViolation(error)) fail(uniqueCode(error, BOOKING_ERROR_CODES.SLOT_UNAVAILABLE), 409);
			throw error;
		}
	});
}
async function deleteBlockedSlot(actorId, id) {
	await withTransaction(async (sql) => {
		if (!(await sql`
      delete from blocked_slots where id = ${id} returning id
    `)[0]) fail(BOOKING_ERROR_CODES.CAR_NOT_FOUND, 404);
		await writeAudit(sql, {
			actorId,
			action: "blocked_slot.deleted",
			targetId: id
		});
	});
}
async function listClients() {
	return (await (await getSql())`
    select p.user_id, p.phone, p.role, p.banned, p.ban_reason, u.name, u.email, p.created_at
    from profiles p
    left join "user" u on u.id = p.user_id
    order by p.created_at desc
  `).map((row) => ({
		userId: row.user_id,
		phone: row.phone,
		role: row.role,
		banned: row.banned,
		banReason: row.ban_reason,
		name: row.name,
		email: row.email
	}));
}
async function setBanned(input) {
	return withTransaction(async (sql) => {
		await sql`select pg_advisory_xact_lock(hashtext(${`booking-user:${input.userId}`}))`;
		await ensureProfile(sql, input.userId);
		if (input.banned) await sql`
        update profiles
        set banned = true,
            ban_reason = ${(input.reason ?? "Bloķēts").trim().slice(0, 300)},
            banned_at = now(),
            updated_at = now()
        where user_id = ${input.userId}
      `;
		else await sql`
        update profiles
        set banned = false,
            ban_reason = null,
            banned_at = null,
            updated_at = now()
        where user_id = ${input.userId}
      `;
		await writeAudit(sql, {
			actorId: input.actorId,
			action: input.banned ? "user.banned" : "user.unbanned",
			targetId: input.userId,
			metadata: { reason: input.reason ?? null }
		});
	});
}
async function listHolidays() {
	return (await (await getSql())`
    select id, date, name, active from holidays order by date
  `).map((row) => ({
		id: row.id,
		date: toDateString(row.date),
		name: row.name,
		active: row.active
	}));
}
async function listAudit(limit = 80) {
	return (await (await getSql())`
    select a.id, a.actor_id, a.action, a.target_id, a.metadata, a.created_at, u.name as actor_name
    from audit_logs a
    left join "user" u on u.id = a.actor_id
    order by a.created_at desc
    limit ${limit}
  `).map((row) => ({
		id: row.id,
		actorId: row.actor_id,
		actorName: row.actor_name,
		action: row.action,
		targetId: row.target_id,
		metadata: JSON.stringify(row.metadata ?? {}),
		createdAt: String(row.created_at)
	}));
}
async function quotePriceForCar(userId, carId) {
	const car = (await (await getSql())`
    select category, user_id from cars where id = ${carId} limit 1
  `)[0];
	if (!car) fail(BOOKING_ERROR_CODES.CAR_NOT_FOUND, 404);
	if (car.user_id !== userId) fail(BOOKING_ERROR_CODES.CAR_NOT_OWNED, 403);
	return {
		category: car.category,
		priceCents: getPriceCents(car.category)
	};
}
var dateSchema = string().regex(/^\d{4}-\d{2}-\d{2}$/);
var timeSchema = string().regex(/^\d{2}:00$/);
var idSchema = string().min(1).max(80);
var phoneSchema = string().trim().min(8).max(20);
var notesSchema = string().trim().max(1e3).optional().nullable();
var getMyProfileFn_createServerFn_handler = createServerRpc({
	id: "1f890bc3a717109e6e4cec9b0b65db18200e0c344e8a72697a0af2e7e57331ff",
	name: "getMyProfileFn",
	filename: "src/server/functions.ts"
}, (opts) => getMyProfileFn.__executeServer(opts));
var getMyProfileFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getMyProfileFn_createServerFn_handler, async ({ context }) => getProfileForUser(context.userId));
var updatePhoneFn_createServerFn_handler = createServerRpc({
	id: "e550da60c6d8165a63c846a3562cee7ca8ae1c2dc7170aa0d861622537d8d296",
	name: "updatePhoneFn",
	filename: "src/server/functions.ts"
}, (opts) => updatePhoneFn.__executeServer(opts));
var updatePhoneFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ phone: phoneSchema }).parse(input)).handler(updatePhoneFn_createServerFn_handler, async ({ context, data }) => updatePhone(context.userId, data.phone));
var listCatalogFn_createServerFn_handler = createServerRpc({
	id: "3210fcb4d468d1f927d4e176306bdf0574204932f65cfae10a9b55e5cdb7b27f",
	name: "listCatalogFn",
	filename: "src/server/functions.ts"
}, (opts) => listCatalogFn.__executeServer(opts));
var listCatalogFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listCatalogFn_createServerFn_handler, async () => listCatalog());
var listMyCarsFn_createServerFn_handler = createServerRpc({
	id: "93007f490b027e39d8f94cd186a6a474add59be98cc695fda3ae1a745159eb10",
	name: "listMyCarsFn",
	filename: "src/server/functions.ts"
}, (opts) => listMyCarsFn.__executeServer(opts));
var listMyCarsFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listMyCarsFn_createServerFn_handler, async ({ context }) => listCarsForUser(context.userId));
var createCarFn_createServerFn_handler = createServerRpc({
	id: "f1903b764ddaee2367ea2a48bb68093e790c110f12f93e82458b746735416106",
	name: "createCarFn",
	filename: "src/server/functions.ts"
}, (opts) => createCarFn.__executeServer(opts));
var createCarFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	makeId: idSchema,
	modelId: idSchema,
	registrationNumber: string().trim().min(2).max(20)
}).parse(input)).handler(createCarFn_createServerFn_handler, async ({ context, data }) => createCar({
	userId: context.userId,
	makeId: data.makeId,
	modelId: data.modelId,
	registrationNumber: data.registrationNumber
}));
var deleteCarFn_createServerFn_handler = createServerRpc({
	id: "bbbd61ae1d64cddd7ae99dff527c1c62f98a183c8a100a2aa6c5fdff034539b7",
	name: "deleteCarFn",
	filename: "src/server/functions.ts"
}, (opts) => deleteCarFn.__executeServer(opts));
var deleteCarFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ carId: idSchema }).parse(input)).handler(deleteCarFn_createServerFn_handler, async ({ context, data }) => {
	await deleteCar(context.userId, data.carId);
	return { ok: true };
});
var getAvailabilityFn_createServerFn_handler = createServerRpc({
	id: "05a05beebe63b87f50694fe65bbbe29cd223fce0b34ae78d6462518fa638a2f9",
	name: "getAvailabilityFn",
	filename: "src/server/functions.ts"
}, (opts) => getAvailabilityFn.__executeServer(opts));
var getAvailabilityFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => object({ date: dateSchema }).parse(input)).handler(getAvailabilityFn_createServerFn_handler, async ({ context, data }) => {
	const profile = await getProfileForUser(context.userId);
	return getSlotAvailability(data.date, { role: profile.role === "admin" ? "admin" : "customer" });
});
var quotePriceFn_createServerFn_handler = createServerRpc({
	id: "c4ed827d199f4e491c9ecf7627d9e5b2fad5bc1ce3baa73dc4f2584a88fbf1aa",
	name: "quotePriceFn",
	filename: "src/server/functions.ts"
}, (opts) => quotePriceFn.__executeServer(opts));
var quotePriceFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => object({ carId: idSchema }).parse(input)).handler(quotePriceFn_createServerFn_handler, async ({ context, data }) => quotePriceForCar(context.userId, data.carId));
var createBookingFn_createServerFn_handler = createServerRpc({
	id: "971c73723c3f11eb0abb8cd1b96dd26a47cb3b064efc69a173832a173d92cca5",
	name: "createBookingFn",
	filename: "src/server/functions.ts"
}, (opts) => createBookingFn.__executeServer(opts));
var createBookingFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	carId: idSchema,
	bookingDate: dateSchema,
	bookingTime: timeSchema,
	notes: notesSchema
}).parse(input)).handler(createBookingFn_createServerFn_handler, async ({ context, data }) => createBooking({
	actorId: context.userId,
	userId: context.userId,
	carId: data.carId,
	bookingDate: data.bookingDate,
	bookingTime: data.bookingTime,
	notes: data.notes,
	isAdmin: false
}));
var listMyBookingsFn_createServerFn_handler = createServerRpc({
	id: "8fd8b7290aa4a0bfc0998d7b161c8d34a91d553bbf71a2a2a271842b61f173e8",
	name: "listMyBookingsFn",
	filename: "src/server/functions.ts"
}, (opts) => listMyBookingsFn.__executeServer(opts));
var listMyBookingsFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(listMyBookingsFn_createServerFn_handler, async ({ context }) => listMyBookings(context.userId));
var cancelBookingFn_createServerFn_handler = createServerRpc({
	id: "1996da21c4afdb8c00588e1997d6735d2e04337ad2df37730e19a580662ddb79",
	name: "cancelBookingFn",
	filename: "src/server/functions.ts"
}, (opts) => cancelBookingFn.__executeServer(opts));
var cancelBookingFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ bookingId: idSchema }).parse(input)).handler(cancelBookingFn_createServerFn_handler, async ({ context, data }) => cancelCustomerBooking(context.userId, data.bookingId));
var adminAvailabilityFn_createServerFn_handler = createServerRpc({
	id: "f62d189944eeafc826c33a0f616033b5355d4e2a3720bdb43e7036cd5815bfa9",
	name: "adminAvailabilityFn",
	filename: "src/server/functions.ts"
}, (opts) => adminAvailabilityFn.__executeServer(opts));
var adminAvailabilityFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => object({ date: dateSchema }).parse(input)).handler(adminAvailabilityFn_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	return getSlotAvailability(data.date, { role: "admin" });
});
var adminListBookingsFn_createServerFn_handler = createServerRpc({
	id: "cb211b92fe43727de91be18253aaa53d9570cab7bb8db9079a4961ca6e7e378d",
	name: "adminListBookingsFn",
	filename: "src/server/functions.ts"
}, (opts) => adminListBookingsFn.__executeServer(opts));
var adminListBookingsFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(adminListBookingsFn_createServerFn_handler, async ({ context }) => {
	await requireAdmin(context.userId);
	return listAdminBookings();
});
var adminCreateBookingFn_createServerFn_handler = createServerRpc({
	id: "31570fabc9217fd17633df2971cde0b9d24d934cf98feb62193f818e1584f7a0",
	name: "adminCreateBookingFn",
	filename: "src/server/functions.ts"
}, (opts) => adminCreateBookingFn.__executeServer(opts));
var adminCreateBookingFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	userId: idSchema,
	carId: idSchema,
	bookingDate: dateSchema,
	bookingTime: timeSchema,
	notes: notesSchema
}).parse(input)).handler(adminCreateBookingFn_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	return createBooking({
		actorId: context.userId,
		userId: data.userId,
		carId: data.carId,
		bookingDate: data.bookingDate,
		bookingTime: data.bookingTime,
		notes: data.notes,
		isAdmin: true
	});
});
var adminUpdateBookingFn_createServerFn_handler = createServerRpc({
	id: "d3de33bd66f97123b1fc736a28802e1d85c380a9cacccd840ca4ae33a89c75ba",
	name: "adminUpdateBookingFn",
	filename: "src/server/functions.ts"
}, (opts) => adminUpdateBookingFn.__executeServer(opts));
var adminUpdateBookingFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	bookingId: idSchema,
	bookingDate: dateSchema.optional(),
	bookingTime: timeSchema.optional(),
	carId: idSchema.optional(),
	status: _enum(BOOKING_STATUSES).optional(),
	notes: notesSchema
}).parse(input)).handler(adminUpdateBookingFn_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	return adminUpdateBooking({
		actorId: context.userId,
		...data
	});
});
var adminListBlockedFn_createServerFn_handler = createServerRpc({
	id: "c945fd3f2460e755ec5782a3c289a26e0b49c1689dac4afb1a2ca95386de27c3",
	name: "adminListBlockedFn",
	filename: "src/server/functions.ts"
}, (opts) => adminListBlockedFn.__executeServer(opts));
var adminListBlockedFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(adminListBlockedFn_createServerFn_handler, async ({ context }) => {
	await requireAdmin(context.userId);
	return listBlockedSlots();
});
var adminCreateBlockedFn_createServerFn_handler = createServerRpc({
	id: "026cc88ecb02bfabbc4031d5eca20d9014df18cd322215939d3849a72c82c892",
	name: "adminCreateBlockedFn",
	filename: "src/server/functions.ts"
}, (opts) => adminCreateBlockedFn.__executeServer(opts));
var adminCreateBlockedFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	bookingDate: dateSchema,
	bookingTime: timeSchema.nullable(),
	reason: string().trim().min(1).max(300)
}).parse(input)).handler(adminCreateBlockedFn_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	return createBlockedSlot({
		actorId: context.userId,
		bookingDate: data.bookingDate,
		bookingTime: data.bookingTime,
		reason: data.reason
	});
});
var adminDeleteBlockedFn_createServerFn_handler = createServerRpc({
	id: "a47405307fa3c500a8331c75ec8a5d9fdfe80cd3358f56347cb31ea694553df5",
	name: "adminDeleteBlockedFn",
	filename: "src/server/functions.ts"
}, (opts) => adminDeleteBlockedFn.__executeServer(opts));
var adminDeleteBlockedFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ id: idSchema }).parse(input)).handler(adminDeleteBlockedFn_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	await deleteBlockedSlot(context.userId, data.id);
	return { ok: true };
});
var adminListClientsFn_createServerFn_handler = createServerRpc({
	id: "3732eb74260e4311d781d4d6ade8750b2ff7951a8bcbf429f4c7af18f199f8da",
	name: "adminListClientsFn",
	filename: "src/server/functions.ts"
}, (opts) => adminListClientsFn.__executeServer(opts));
var adminListClientsFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(adminListClientsFn_createServerFn_handler, async ({ context }) => {
	await requireAdmin(context.userId);
	return listClients();
});
var adminSetBannedFn_createServerFn_handler = createServerRpc({
	id: "47dbf4a5bc01ef86abb955945435bb6c7f4723f4a7089c35662a1dab9ca43f2b",
	name: "adminSetBannedFn",
	filename: "src/server/functions.ts"
}, (opts) => adminSetBannedFn.__executeServer(opts));
var adminSetBannedFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	userId: idSchema,
	banned: boolean(),
	reason: string().trim().max(300).optional()
}).parse(input)).handler(adminSetBannedFn_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	await setBanned({
		actorId: context.userId,
		userId: data.userId,
		banned: data.banned,
		reason: data.reason
	});
	return { ok: true };
});
var adminListHolidaysFn_createServerFn_handler = createServerRpc({
	id: "860e920e0ef8eea501fb0aaa0026375055d41f41591f06a90f8b07a9472267db",
	name: "adminListHolidaysFn",
	filename: "src/server/functions.ts"
}, (opts) => adminListHolidaysFn.__executeServer(opts));
var adminListHolidaysFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(adminListHolidaysFn_createServerFn_handler, async ({ context }) => {
	await requireAdmin(context.userId);
	return listHolidays();
});
var adminListAuditFn_createServerFn_handler = createServerRpc({
	id: "a0c09986174e4b6f2a87d05a0b477f8c00cd5de9b50582a411ac9fc5b4a2d138",
	name: "adminListAuditFn",
	filename: "src/server/functions.ts"
}, (opts) => adminListAuditFn.__executeServer(opts));
var adminListAuditFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(adminListAuditFn_createServerFn_handler, async ({ context }) => {
	await requireAdmin(context.userId);
	return listAudit();
});
var adminListClientCarsFn_createServerFn_handler = createServerRpc({
	id: "89ace130793279ceb5acb0291059362f3f866e6a396a2129c95526b6bd7aa112",
	name: "adminListClientCarsFn",
	filename: "src/server/functions.ts"
}, (opts) => adminListClientCarsFn.__executeServer(opts));
var adminListClientCarsFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => object({ userId: idSchema }).parse(input)).handler(adminListClientCarsFn_createServerFn_handler, async ({ context, data }) => {
	await requireAdmin(context.userId);
	return listCarsForUser(data.userId);
});
//#endregion
export { adminAvailabilityFn_createServerFn_handler, adminCreateBlockedFn_createServerFn_handler, adminCreateBookingFn_createServerFn_handler, adminDeleteBlockedFn_createServerFn_handler, adminListAuditFn_createServerFn_handler, adminListBlockedFn_createServerFn_handler, adminListBookingsFn_createServerFn_handler, adminListClientCarsFn_createServerFn_handler, adminListClientsFn_createServerFn_handler, adminListHolidaysFn_createServerFn_handler, adminSetBannedFn_createServerFn_handler, adminUpdateBookingFn_createServerFn_handler, cancelBookingFn_createServerFn_handler, createBookingFn_createServerFn_handler, createCarFn_createServerFn_handler, deleteCarFn_createServerFn_handler, getAvailabilityFn_createServerFn_handler, getMyProfileFn_createServerFn_handler, listCatalogFn_createServerFn_handler, listMyBookingsFn_createServerFn_handler, listMyCarsFn_createServerFn_handler, quotePriceFn_createServerFn_handler, updatePhoneFn_createServerFn_handler };
