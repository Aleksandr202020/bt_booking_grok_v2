import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { l as messageForError } from "./middleware-CDYsiKlx.mjs";
import { c as adminListClientsFn, l as adminSetBannedFn } from "./functions-PbePFcDc.mjs";
import { t as Card } from "./card-Dsq3FXOV.mjs";
import { t as Button } from "./button-DFtBDFjg.mjs";
import { t as Input } from "./input-CpDUXnaQ.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Badge } from "./badge-D51PCq8e.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/clients-C-fKk2GB.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ClientsPage() {
	const qc = useQueryClient();
	const [reason, setReason] = (0, import_react.useState)("Pārkāpti noteikumi");
	const clients = useQuery({
		queryKey: ["admin-clients"],
		queryFn: () => adminListClientsFn()
	});
	const ban = useMutation({
		mutationFn: (input) => adminSetBannedFn({ data: {
			...input,
			reason: input.banned ? reason : void 0
		} }),
		onSuccess: () => {
			toast.success("Klienta statuss atjaunināts");
			qc.invalidateQueries({ queryKey: ["admin-clients"] });
		},
		onError: (err) => toast.error(messageForError(err))
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mb-4 max-w-sm",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
			value: reason,
			onChange: (e) => setReason(e.target.value),
			placeholder: "Ban iemesls"
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "space-y-3",
		children: (clients.data ?? []).map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
			className: "flex flex-col gap-3 rounded-xl sm:flex-row sm:items-center sm:justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-medium",
					children: c.name ?? "Bez vārda"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted",
					children: [
						c.email,
						" ",
						c.phone ? `· ${c.phone}` : ""
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: c.role === "admin" ? "steel" : "neutral",
						children: c.role
					}), c.banned ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: "danger",
						children: "BAN"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: "ok",
						children: "aktīvs"
					})]
				}),
				c.banReason ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs text-danger",
					children: c.banReason
				}) : null
			] }), c.role === "admin" ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: c.banned ? "secondary" : "danger",
				onClick: () => ban.mutate({
					userId: c.userId,
					banned: !c.banned
				}),
				children: c.banned ? "Atbloķēt" : "Bloķēt"
			})]
		}, c.userId))
	})] });
}
//#endregion
export { ClientsPage as component };
