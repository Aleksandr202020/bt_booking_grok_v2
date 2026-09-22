import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { a as require_jsx_runtime, n as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { f as cn, t as adminAvailabilityFn } from "./functions-PbePFcDc.mjs";
import { t as Card } from "./card-Dsq3FXOV.mjs";
import { a as getRigaNowParts, i as formatLvDate, r as formatEuro, t as addCalendarDays } from "./dates-DHkzvHRL.mjs";
import { t as Badge } from "./badge-D51PCq8e.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/calendar-BBUtWrPY.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminCalendar() {
	const today = getRigaNowParts().date;
	const [date, setDate] = (0, import_react.useState)(today);
	const availability = useQuery({
		queryKey: ["admin-availability", date],
		queryFn: () => adminAvailabilityFn({ data: { date } })
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-wrap items-center gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type: "date",
				value: date,
				onChange: (e) => setDate(e.target.value),
				className: "h-11 rounded-md border border-border bg-bg-elevated px-3 text-sm"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "text-sm text-muted hover:text-fg",
				onClick: () => setDate(addCalendarDays(date, -1)),
				children: "Iepriekšējā"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "text-sm text-muted hover:text-fg",
				onClick: () => setDate(addCalendarDays(date, 1)),
				children: "Nākamā"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm text-muted",
				children: formatLvDate(date)
			}),
			availability.data?.holiday ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
				tone: "danger",
				children: availability.data.holiday
			}) : null
		]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3",
		children: (availability.data?.slots ?? []).map((slot) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
			className: cn("rounded-lg p-4", slot.state === "available" && "border-ok/30 bg-ok-bg", slot.state === "booked" && "border-warn/30 bg-warn-bg", (slot.state === "blocked" || slot.state === "holiday") && "border-danger/30 bg-danger-bg"),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-xl tabular-nums",
						children: slot.time
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: slot.state === "available" ? "ok" : slot.state === "booked" ? "warn" : "danger",
						children: slot.state
					})]
				}),
				slot.customerName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm",
					children: slot.customerName
				}) : null,
				slot.registrationNumber ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-mono text-xs text-muted",
					children: slot.registrationNumber
				}) : null,
				slot.priceCents ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm tabular-nums",
					children: formatEuro(slot.priceCents)
				}) : null,
				slot.reason ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs text-muted",
					children: slot.reason
				}) : null
			]
		}, slot.time))
	})] });
}
//#endregion
export { AdminCalendar as component };
