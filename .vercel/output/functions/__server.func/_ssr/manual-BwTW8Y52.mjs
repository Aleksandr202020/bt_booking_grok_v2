import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { l as messageForError, o as WORKING_SLOTS } from "./middleware-CDYsiKlx.mjs";
import { c as adminListClientsFn, r as adminCreateBookingFn, s as adminListClientCarsFn, t as adminAvailabilityFn } from "./functions-PbePFcDc.mjs";
import { t as Card } from "./card-Dsq3FXOV.mjs";
import { a as getRigaNowParts } from "./dates-DHkzvHRL.mjs";
import { t as Button } from "./button-DFtBDFjg.mjs";
import { t as Label } from "./label-Dc6zNc_X.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/manual-BwTW8Y52.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ManualBooking() {
	const qc = useQueryClient();
	const today = getRigaNowParts().date;
	const [userId, setUserId] = (0, import_react.useState)("");
	const [carId, setCarId] = (0, import_react.useState)("");
	const [date, setDate] = (0, import_react.useState)(today);
	const [time, setTime] = (0, import_react.useState)("");
	const clients = useQuery({
		queryKey: ["admin-clients"],
		queryFn: () => adminListClientsFn()
	});
	const cars = useQuery({
		queryKey: ["admin-client-cars", userId],
		queryFn: () => adminListClientCarsFn({ data: { userId } }),
		enabled: Boolean(userId)
	});
	const availability = useQuery({
		queryKey: ["admin-availability", date],
		queryFn: () => adminAvailabilityFn({ data: { date } })
	});
	const create = useMutation({
		mutationFn: () => adminCreateBookingFn({ data: {
			userId,
			carId,
			bookingDate: date,
			bookingTime: time
		} }),
		onSuccess: () => {
			toast.success("Manuālā rezervācija izveidota");
			setTime("");
			qc.invalidateQueries({ queryKey: ["admin-availability"] });
			qc.invalidateQueries({ queryKey: ["admin-bookings"] });
		},
		onError: (err) => toast.error(messageForError(err))
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		className: "max-w-lg rounded-xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-xl font-semibold",
				children: "Rezervācija pa tālruni"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: "Tās pašas servera pārbaudes: svētki, bloki, konflikti, kategorija, cena."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-4 space-y-3",
				onSubmit: (e) => {
					e.preventDefault();
					create.mutate();
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Klients" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							className: "h-11 w-full rounded-md border border-border bg-bg-elevated px-3 text-sm",
							value: userId,
							onChange: (e) => {
								setUserId(e.target.value);
								setCarId("");
							},
							required: true,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "",
								children: "Izvēlies klientu"
							}), (clients.data ?? []).map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
								value: c.userId,
								children: [
									c.name ?? c.email,
									" ",
									c.phone ? `· ${c.phone}` : ""
								]
							}, c.userId))]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Auto" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							className: "h-11 w-full rounded-md border border-border bg-bg-elevated px-3 text-sm",
							value: carId,
							onChange: (e) => setCarId(e.target.value),
							required: true,
							disabled: !userId,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "",
								children: "Izvēlies auto"
							}), (cars.data ?? []).map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
								value: c.id,
								children: [
									c.makeName,
									" ",
									c.modelName,
									" · ",
									c.registrationNumber
								]
							}, c.id))]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Datums" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "date",
							value: date,
							onChange: (e) => setDate(e.target.value),
							className: "h-11 w-full rounded-md border border-border bg-bg-elevated px-3 text-sm",
							required: true
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Laiks" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							className: "h-11 w-full rounded-md border border-border bg-bg-elevated px-3 text-sm",
							value: time,
							onChange: (e) => setTime(e.target.value),
							required: true,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "",
								children: "Stunda"
							}), WORKING_SLOTS.map((slot) => {
								const state = availability.data?.slots.find((s) => s.time === slot)?.state;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
									value: slot,
									disabled: state && state !== "available",
									children: [
										slot,
										" ",
										state && state !== "available" ? `· ${state}` : ""
									]
								}, slot);
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						className: "w-full",
						disabled: create.isPending,
						children: "Izveidot"
					})
				]
			})
		]
	});
}
//#endregion
export { ManualBooking as component };
