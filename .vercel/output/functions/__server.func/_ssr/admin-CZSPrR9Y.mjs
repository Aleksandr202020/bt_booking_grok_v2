import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as require_jsx_runtime, n as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { c as adminListClientsFn, o as adminListBookingsFn, t as adminAvailabilityFn } from "./functions-PbePFcDc.mjs";
import { t as Card } from "./card-Dsq3FXOV.mjs";
import { a as getRigaNowParts } from "./dates-DHkzvHRL.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-CZSPrR9Y.js
var import_jsx_runtime = require_jsx_runtime();
function AdminHome() {
	const today = getRigaNowParts().date;
	const availability = useQuery({
		queryKey: ["admin-availability", today],
		queryFn: () => adminAvailabilityFn({ data: { date: today } })
	});
	const bookings = useQuery({
		queryKey: ["admin-bookings"],
		queryFn: () => adminListBookingsFn()
	});
	const clients = useQuery({
		queryKey: ["admin-clients"],
		queryFn: () => adminListClientsFn()
	});
	const slots = availability.data?.slots ?? [];
	const booked = slots.filter((s) => s.state === "booked").length;
	const blocked = slots.filter((s) => s.state === "blocked" || s.state === "holiday").length;
	const free = slots.filter((s) => s.state === "available").length;
	const banned = (clients.data ?? []).filter((c) => c.banned).length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-3 md:grid-cols-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "rounded-xl",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs uppercase tracking-[0.16em] text-muted",
						children: "Šodien brīvi"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 font-display text-4xl tabular-nums",
						children: free
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm text-muted",
						children: [
							booked,
							" aizņemti · ",
							blocked,
							" bloķēti"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/admin/calendar",
						className: "mt-4 inline-block text-sm text-steel hover:text-fg",
						children: "Atvērt kalendāru"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "rounded-xl",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs uppercase tracking-[0.16em] text-muted",
						children: "Rezervācijas"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 font-display text-4xl tabular-nums",
						children: bookings.data?.length ?? 0
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/admin/bookings",
						className: "mt-4 inline-block text-sm text-steel hover:text-fg",
						children: "Skatīt visas"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "rounded-xl",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs uppercase tracking-[0.16em] text-muted",
						children: "Klienti"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 font-display text-4xl tabular-nums",
						children: clients.data?.length ?? 0
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm text-muted",
						children: [banned, " bloķēti"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/admin/clients",
						className: "mt-4 inline-block text-sm text-steel hover:text-fg",
						children: "Ban / unban"
					})
				]
			})
		]
	});
}
//#endregion
export { AdminHome as component };
