import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { t as Card } from "./card-Dsq3FXOV.mjs";
import { t as Button } from "./button-DFtBDFjg.mjs";
import { i as Shield, o as Droplets, r as Timer, s as Clock } from "../_libs/lucide-react.mjs";
import { t as AppShell } from "./shell-BdYsgFSr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-cvW3EsEa.js
var import_jsx_runtime = require_jsx_runtime();
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "grid gap-10 pb-8 pt-4 md:grid-cols-[1.3fr_0.7fr] md:items-end",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium uppercase tracking-[0.22em] text-steel",
					children: "BT Automazgātava · Rīga"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-4 max-w-xl font-display text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl",
					children: "Roku mazgāšana. Viens boks. Viena stunda."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-5 max-w-lg text-base leading-relaxed text-muted md:text-lg",
					children: "Maksimālā kvalitāte ierobežotā laikā. Bez piemaksas par netīrību. Darba laiks 09:00–21:00."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 flex flex-wrap gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						size: "lg",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/booking",
							children: "Rezervēt laiku"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						size: "lg",
						variant: "secondary",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/login",
							children: "Ienākt"
						})
					})]
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "rounded-xl p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs uppercase tracking-[0.18em] text-muted",
						children: "Šodien"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 font-display text-3xl font-semibold tabular-nums",
						children: "09:00–21:00"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: "12 stundu logi · 1 automašīna stundā"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-6 grid grid-cols-3 gap-2",
						children: [
							"09",
							"13",
							"17"
						].map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-md border border-border bg-bg-elevated px-3 py-3 text-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "font-display text-lg tabular-nums",
								children: [h, ":00"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[11px] text-subtle",
								children: "60 min"
							})]
						}, h))
					})
				]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			className: "mt-6 grid gap-3 md:grid-cols-3",
			children: [
				{
					price: "25 €",
					title: "Pasažieru auto",
					note: "Standarta hatchback un sedans."
				},
				{
					price: "30 €",
					title: "Crossover / SUV",
					note: "Piemēram, Škoda Kamiq vai Opel Zafira."
				},
				{
					price: "35 €",
					title: "Minivans / komerc.",
					note: "V-Class, Caddy, Berlingo un līdzīgi."
				}
			].map((tier) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "rounded-xl",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-3xl font-semibold tabular-nums",
						children: tier.price
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-3 text-lg font-medium",
						children: tier.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: tier.note
					})
				]
			}, tier.title))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
			className: "mt-10 grid gap-3 md:grid-cols-4",
			children: [
				{
					icon: Clock,
					title: "1. Automašīna",
					text: "Pievieno marku, modeli un numuru."
				},
				{
					icon: Timer,
					title: "2. Datums",
					text: "Izvēlies dienu nākamo 30 dienu logā."
				},
				{
					icon: Droplets,
					title: "3. Stunda",
					text: "Redzi brīvos, aizņemtos un bloķētos laikus."
				},
				{
					icon: Shield,
					title: "4. Apstiprinājums",
					text: "Cenu rēķina serveris pēc kategorijas."
				}
			].map((step) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "rounded-xl",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(step.icon, { className: "size-5 text-steel" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "mt-4 text-sm font-medium",
						children: step.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: step.text
					})
				]
			}, step.title))
		})
	] });
}
//#endregion
export { Home as component };
