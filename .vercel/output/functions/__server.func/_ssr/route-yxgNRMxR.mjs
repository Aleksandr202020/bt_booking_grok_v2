import { f as useRouterState, h as Outlet, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as require_jsx_runtime, n as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { _ as getMyProfileFn, f as cn } from "./functions-PbePFcDc.mjs";
import { n as RequireAuth, t as AppShell } from "./shell-BdYsgFSr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/route-yxgNRMxR.js
var import_jsx_runtime = require_jsx_runtime();
var LINKS = [
	{
		to: "/admin",
		label: "Pārskats"
	},
	{
		to: "/admin/calendar",
		label: "Kalendārs"
	},
	{
		to: "/admin/bookings",
		label: "Rezervācijas"
	},
	{
		to: "/admin/manual",
		label: "Manuālā"
	},
	{
		to: "/admin/blocked",
		label: "Bloki"
	},
	{
		to: "/admin/clients",
		label: "Klienti"
	}
];
function AdminLayout() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RequireAuth, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdminGate, {}) }) });
}
function AdminGate() {
	const profile = useQuery({
		queryKey: ["profile"],
		queryFn: () => getMyProfileFn()
	});
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	if (profile.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-40 animate-pulse rounded-xl bg-surface" });
	if (profile.data?.role !== "admin") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
		className: "font-display text-2xl font-semibold",
		children: "Nav piekļuves"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mt-2 text-sm text-muted",
		children: "Šī sadaļa ir tikai administratoram."
	})] });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs uppercase tracking-[0.2em] text-steel",
			children: "Admin"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "mt-2 font-display text-3xl font-semibold",
			children: "Vadība"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
			className: "-mx-1 mt-5 flex gap-1 overflow-x-auto pb-2",
			children: LINKS.map((link) => {
				const active = link.to === "/admin" ? pathname === "/admin" : pathname.startsWith(link.to);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: link.to,
					className: cn("whitespace-nowrap rounded-full px-3 py-2 text-sm", active ? "bg-fg text-bg" : "text-muted hover:text-fg"),
					children: link.label
				}, link.to);
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
		})
	] });
}
//#endregion
export { AdminLayout as component };
