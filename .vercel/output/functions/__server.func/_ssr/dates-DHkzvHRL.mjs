import { a as CLOSED_HOLIDAYS, n as APP_TIMEZONE, o as WORKING_SLOTS } from "./middleware-CDYsiKlx.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dates-DHkzvHRL.js
var ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
var SLOT = /^\d{2}:00$/;
function isValidIsoDate(value) {
	if (!ISO_DATE.test(value)) return false;
	const [year, month, day] = value.split("-").map(Number);
	const date = new Date(Date.UTC(year, month - 1, day));
	return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
function isWorkingSlot(value) {
	return SLOT.test(value) && WORKING_SLOTS.includes(value);
}
function getRigaNowParts(now = /* @__PURE__ */ new Date()) {
	const formatter = new Intl.DateTimeFormat("en-CA", {
		timeZone: APP_TIMEZONE,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23"
	});
	const parts = Object.fromEntries(formatter.formatToParts(now).map((p) => [p.type, p.value]));
	return {
		date: `${parts.year}-${parts.month}-${parts.day}`,
		time: `${parts.hour}:${parts.minute}`
	};
}
function isPastSlot(date, time, now = /* @__PURE__ */ new Date()) {
	const current = getRigaNowParts(now);
	return `${date} ${time}` <= `${current.date} ${current.time}`;
}
function addCalendarDays(date, days) {
	const [year, month, day] = date.split("-").map(Number);
	return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}
function daysBetween(start, end) {
	const [sy, sm, sd] = start.split("-").map(Number);
	const [ey, em, ed] = end.split("-").map(Number);
	return Math.round((Date.UTC(ey, em - 1, ed) - Date.UTC(sy, sm - 1, sd)) / 864e5);
}
function isClosedHolidayDate(date) {
	if (!isValidIsoDate(date)) return { closed: false };
	const [, month, day] = date.split("-").map(Number);
	const hit = CLOSED_HOLIDAYS.find((h) => h.month === month && h.day === day);
	return hit ? {
		closed: true,
		name: hit.name
	} : { closed: false };
}
function toDateString(value) {
	if (value instanceof Date) return value.toISOString().slice(0, 10);
	return String(value ?? "").slice(0, 10);
}
function toTimeString(value) {
	return String(value ?? "").slice(0, 5);
}
function formatEuro(cents) {
	return `${Math.round(cents / 100)} €`;
}
function formatLvDate(date) {
	if (!isValidIsoDate(date)) return date;
	const [y, m, d] = date.split("-").map(Number);
	return new Intl.DateTimeFormat("lv-LV", {
		weekday: "short",
		day: "numeric",
		month: "long"
	}).format(new Date(Date.UTC(y, m - 1, d)));
}
//#endregion
export { getRigaNowParts as a, isValidIsoDate as c, toTimeString as d, formatLvDate as i, isWorkingSlot as l, daysBetween as n, isClosedHolidayDate as o, formatEuro as r, isPastSlot as s, addCalendarDays as t, toDateString as u };
