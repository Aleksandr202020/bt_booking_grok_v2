import { n as createMiddleware } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/middleware-CDYsiKlx.js
var APP_TIMEZONE = "Europe/Riga";
var WORKING_SLOTS = Array.from({ length: 12 }, (_, index) => `${String(9 + index).padStart(2, "0")}:00`);
var ACTIVE_BOOKING_STATUSES = ["pending", "confirmed"];
var BOOKING_STATUSES = [
	"pending",
	"confirmed",
	"completed",
	"cancelled_customer",
	"cancelled_admin",
	"no_show"
];
var CLOSED_HOLIDAYS = [{
	month: 6,
	day: 23,
	name: "Līgo diena"
}, {
	month: 6,
	day: 24,
	name: "Jāņi"
}];
var BOOKING_ERROR_CODES = {
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
	BOOKING_NOT_FOUND_OR_NOT_CANCELLABLE: "BOOKING_NOT_FOUND_OR_NOT_CANCELLABLE"
};
var ERROR_MESSAGES_LV = {
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
	Unauthorized: "Nepieciešama autorizācija."
};
function messageForError(error) {
	const raw = error instanceof Error ? error.message : typeof error === "string" ? error : "";
	return ERROR_MESSAGES_LV[raw] ?? (raw || "Neizdevās izpildīt darbību.");
}
var BookingError = class extends Error {
	code;
	status;
	constructor(code, status = 409) {
		super(code);
		this.name = "BookingError";
		this.code = code;
		this.status = status;
	}
};
function fail(code, status = 409) {
	throw new BookingError(code, status);
}
/**
* Auth middleware for server functions — the standard way to get the caller's
* verified user id. When deployed the session cookie is same-origin and rides
* along automatically. In the live preview the client also forwards the bearer
* token (partitioned cookies) via the `.client` hook below — call sites do not
* thread it themselves.
*
*   import { createServerFn } from "@tanstack/react-start";
*   import { getSql } from "@/lib/db";
*   import { authMiddleware } from "@/lib/auth/middleware";
*
*   export const listTodos = createServerFn({ method: "GET" })
*     .middleware([authMiddleware])
*     .handler(async ({ context }) => {
*       const sql = await getSql();
*       return sql`select * from todos where user_id = ${context.userId}`;
*     });
*
* Signed out with auth on (live preview included) -> throws `UnauthorizedError`
* (see `verify.server.ts`). With auth disabled (`VITE_AUTH_ENABLED=false`, the
* shipped default) it resolves the shared dev user — but throws instead when a
* `DATABASE_URL` is also set, so an app without sign-in must not use this at
* all. On the auth-on path, use it on every server function that touches
* per-user data and scope every query by `context.userId`.
*/
var authMiddleware = createMiddleware({ type: "function" }).client(async ({ next }) => {
	const { getBearerToken } = await import("./client-B40BzJxt.mjs").then((n) => n.n).then((n) => n.n);
	return next({ sendContext: { bearerToken: getBearerToken() ?? void 0 } });
}).server(async ({ next, context }) => {
	const { assertSameSiteRequest } = await import("./isolation.server-CGNg1r0B.mjs");
	const { requireUserId } = await import("./verify.server-6PYPAYCQ.mjs");
	assertSameSiteRequest();
	return next({ context: { userId: await requireUserId(context.bearerToken) } });
});
//#endregion
export { CLOSED_HOLIDAYS as a, fail as c, BOOKING_STATUSES as i, messageForError as l, APP_TIMEZONE as n, WORKING_SLOTS as o, BOOKING_ERROR_CODES as r, authMiddleware as s, ACTIVE_BOOKING_STATUSES as t };
