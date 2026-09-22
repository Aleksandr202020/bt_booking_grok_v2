import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { l as messageForError, t as ACTIVE_BOOKING_STATUSES } from "./middleware-CDYsiKlx.mjs";
import { d as cancelBookingFn, y as listMyBookingsFn } from "./functions-PbePFcDc.mjs";
import { t as Card } from "./card-Dsq3FXOV.mjs";
import { i as formatLvDate, r as formatEuro, s as isPastSlot } from "./dates-DHkzvHRL.mjs";
import { t as Button } from "./button-DFtBDFjg.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Badge } from "./badge-D51PCq8e.mjs";
import { n as RequireAuth, t as AppShell } from "./shell-BdYsgFSr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/bookings-CLBd4hrD.js
var import_jsx_runtime = require_jsx_runtime();
var STATUS_LABEL = {
	pending: "Gaida",
	confirmed: "Apstiprināta",
	completed: "Pabeigta",
	cancelled_customer: "Atcelta",
	cancelled_admin: "Atcelta (admin)",
	no_show: "Nepiedalījās"
};
function toneFor(status) {
	if (status === "confirmed" || status === "pending") return "ok";
	if (status === "completed") return "steel";
	if (status === "no_show") return "warn";
	return "danger";
}
function BookingsPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RequireAuth, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookingsBody, {}) }) });
}
function BookingsBody() {
	const qc = useQueryClient();
	const bookings = useQuery({
		queryKey: ["bookings"],
		queryFn: () => listMyBookingsFn()
	});
	const cancel = useMutation({
		mutationFn: (bookingId) => cancelBookingFn({ data: { bookingId } }),
		onSuccess: () => {
			toast.success("Rezervācija atcelta");
			qc.invalidateQueries({ queryKey: ["bookings"] });
		},
		onError: (err) => toast.error(messageForError(err))
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs uppercase tracking-[0.2em] text-steel",
			children: "Grafiks"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "mt-2 font-display text-3xl font-semibold",
			children: "Manas reizes"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-6 space-y-3",
			children: [(bookings.data ?? []).length === 0 && !bookings.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "rounded-xl",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Vēl nav rezervāciju."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					className: "mt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/booking",
						children: "Rezervēt laiku"
					})
				})]
			}) : null, (bookings.data ?? []).map((b) => {
				const cancellable = ACTIVE_BOOKING_STATUSES.includes(b.status) && !isPastSlot(b.bookingDate, b.bookingTime);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "flex flex-col gap-3 rounded-xl sm:flex-row sm:items-center sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "font-display text-lg font-semibold",
							children: [
								formatLvDate(b.bookingDate),
								" · ",
								b.bookingTime
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 text-sm text-muted",
							children: [
								b.makeName,
								" ",
								b.modelName,
								" · ",
								b.registrationNumber
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex flex-wrap gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: toneFor(b.status),
								children: STATUS_LABEL[b.status] ?? b.status
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: formatEuro(b.priceCents) })]
						})
					] }), cancellable ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "danger",
						onClick: () => cancel.mutate(b.id),
						disabled: cancel.isPending,
						children: "Atcelt"
					}) : null]
				}, b.id);
			})]
		})
	] });
}
//#endregion
export { BookingsPage as component };
