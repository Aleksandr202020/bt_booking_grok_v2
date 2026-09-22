import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { l as messageForError, o as WORKING_SLOTS } from "./middleware-CDYsiKlx.mjs";
import { a as adminListBlockedFn, i as adminDeleteBlockedFn, n as adminCreateBlockedFn } from "./functions-PbePFcDc.mjs";
import { t as Card } from "./card-Dsq3FXOV.mjs";
import { a as getRigaNowParts, i as formatLvDate } from "./dates-DHkzvHRL.mjs";
import { t as Button } from "./button-DFtBDFjg.mjs";
import { t as Input } from "./input-CpDUXnaQ.mjs";
import { t as Label } from "./label-Dc6zNc_X.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/blocked-Dg6v10Zn.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function BlockedPage() {
	const qc = useQueryClient();
	const today = getRigaNowParts().date;
	const [date, setDate] = (0, import_react.useState)(today);
	const [time, setTime] = (0, import_react.useState)("");
	const [wholeDay, setWholeDay] = (0, import_react.useState)(false);
	const [reason, setReason] = (0, import_react.useState)("");
	const list = useQuery({
		queryKey: ["admin-blocked"],
		queryFn: () => adminListBlockedFn()
	});
	const create = useMutation({
		mutationFn: () => adminCreateBlockedFn({ data: {
			bookingDate: date,
			bookingTime: wholeDay ? null : time,
			reason
		} }),
		onSuccess: () => {
			toast.success("Laiks bloķēts");
			setReason("");
			qc.invalidateQueries({ queryKey: ["admin-blocked"] });
			qc.invalidateQueries({ queryKey: ["admin-availability"] });
		},
		onError: (err) => toast.error(messageForError(err))
	});
	const remove = useMutation({
		mutationFn: (id) => adminDeleteBlockedFn({ data: { id } }),
		onSuccess: () => {
			toast.success("Bloks noņemts");
			qc.invalidateQueries({ queryKey: ["admin-blocked"] });
		},
		onError: (err) => toast.error(messageForError(err))
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-6 lg:grid-cols-[0.8fr_1.2fr]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
			className: "h-fit rounded-xl",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-xl font-semibold",
				children: "Bloķēt laiku"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-4 space-y-3",
				onSubmit: (e) => {
					e.preventDefault();
					create.mutate();
				},
				children: [
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
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex min-h-11 items-center gap-2 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: wholeDay,
							onChange: (e) => setWholeDay(e.target.checked)
						}), "Visa diena"]
					}),
					wholeDay ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Stunda" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							className: "h-11 w-full rounded-md border border-border bg-bg-elevated px-3 text-sm",
							value: time,
							onChange: (e) => setTime(e.target.value),
							required: true,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "",
								children: "Izvēlies"
							}), WORKING_SLOTS.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: s,
								children: s
							}, s))]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: "Iemesls" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: reason,
							onChange: (e) => setReason(e.target.value),
							required: true
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						className: "w-full",
						disabled: create.isPending,
						children: "Bloķēt"
					})
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-3",
			children: [(list.data ?? []).map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "flex items-start justify-between gap-3 rounded-xl",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "font-medium",
					children: [
						formatLvDate(row.bookingDate),
						" · ",
						row.bookingTime ?? "visa diena"
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: row.reason
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "sm",
					onClick: () => remove.mutate(row.id),
					children: "Noņemt"
				})]
			}, row.id)), (list.data ?? []).length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Nav bloķētu laiku."
			}) : null]
		})]
	});
}
//#endregion
export { BlockedPage as component };
