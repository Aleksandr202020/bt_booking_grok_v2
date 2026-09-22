import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { i as BOOKING_STATUSES, l as messageForError } from "./middleware-CDYsiKlx.mjs";
import { o as adminListBookingsFn, u as adminUpdateBookingFn } from "./functions-PbePFcDc.mjs";
import { t as Card } from "./card-Dsq3FXOV.mjs";
import { i as formatLvDate, r as formatEuro } from "./dates-DHkzvHRL.mjs";
import { t as Button } from "./button-DFtBDFjg.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Badge } from "./badge-D51PCq8e.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/bookings-CV2xGon5.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var STATUS_LABEL = {
	pending: "Gaida",
	confirmed: "Apstiprināta",
	completed: "Pabeigta",
	cancelled_customer: "Klients atcēla",
	cancelled_admin: "Admin atcēla",
	no_show: "Nepiedalījās"
};
function AdminBookings() {
	const qc = useQueryClient();
	const [q, setQ] = (0, import_react.useState)("");
	const bookings = useQuery({
		queryKey: ["admin-bookings"],
		queryFn: () => adminListBookingsFn()
	});
	const update = useMutation({
		mutationFn: (input) => adminUpdateBookingFn({ data: input }),
		onSuccess: () => {
			toast.success("Statuss atjaunināts");
			qc.invalidateQueries({ queryKey: ["admin-bookings"] });
		},
		onError: (err) => toast.error(messageForError(err))
	});
	const rows = (bookings.data ?? []).filter((b) => {
		return `${b.customerName} ${b.customerPhone} ${b.registrationNumber} ${b.id}`.toLowerCase().includes(q.toLowerCase());
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			value: q,
			onChange: (e) => setQ(e.target.value),
			placeholder: "Meklēt pēc vārda, tālruņa, numura",
			className: "h-11 w-full max-w-md rounded-md border border-border bg-bg-elevated px-3 text-sm"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 overflow-x-auto",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "w-full min-w-[860px] text-left text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
					className: "text-xs uppercase tracking-wide text-muted",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "py-2 pr-3",
							children: "Datums"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "py-2 pr-3",
							children: "Klients"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "py-2 pr-3",
							children: "Auto"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "py-2 pr-3",
							children: "Cena"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							className: "py-2 pr-3",
							children: "Statuss"
						})
					] })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: "border-t border-border",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
							className: "py-3 pr-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-medium",
								children: formatLvDate(b.bookingDate)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "tabular-nums text-muted",
								children: b.bookingTime
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
							className: "py-3 pr-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: b.customerName ?? "—" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-muted",
								children: b.customerPhone ?? b.customerEmail
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
							className: "py-3 pr-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								b.makeName,
								" ",
								b.modelName
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-mono text-xs text-steel",
								children: b.registrationNumber
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "py-3 pr-3 tabular-nums",
							children: formatEuro(b.priceCents)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "py-3 pr-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: STATUS_LABEL[b.status] ?? b.status }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
									className: "h-9 rounded-sm border border-border bg-bg-elevated px-2 text-xs",
									value: b.status,
									onChange: (e) => update.mutate({
										bookingId: b.id,
										status: e.target.value
									}),
									children: BOOKING_STATUSES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: s,
										children: STATUS_LABEL[s] ?? s
									}, s))
								})]
							})
						})
					]
				}, b.id)) })]
			}), rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				className: "mt-4 rounded-xl text-sm text-muted",
				children: "Nav rezervāciju."
			}) : null]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			variant: "ghost",
			className: "mt-3",
			onClick: () => void qc.invalidateQueries({ queryKey: ["admin-bookings"] }),
			children: "Atjaunot"
		})
	] });
}
//#endregion
export { AdminBookings as component };
