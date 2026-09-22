import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { l as messageForError } from "./middleware-CDYsiKlx.mjs";
import { b as listMyCarsFn, h as deleteCarFn, m as createCarFn, v as listCatalogFn } from "./functions-PbePFcDc.mjs";
import { t as Card } from "./card-Dsq3FXOV.mjs";
import { r as formatEuro } from "./dates-DHkzvHRL.mjs";
import { t as Button } from "./button-DFtBDFjg.mjs";
import { t as Input } from "./input-CpDUXnaQ.mjs";
import { t as Label } from "./label-Dc6zNc_X.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Badge } from "./badge-D51PCq8e.mjs";
import { n as RequireAuth, t as AppShell } from "./shell-BdYsgFSr.mjs";
import { n as getPriceCents, t as CATEGORY_LABELS_LV } from "./pricing-D2q3Uz5_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/cars-B9ei7s_r.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CarsPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RequireAuth, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CarsBody, {}) }) });
}
function CarsBody() {
	const qc = useQueryClient();
	const cars = useQuery({
		queryKey: ["cars"],
		queryFn: () => listMyCarsFn()
	});
	const catalog = useQuery({
		queryKey: ["catalog"],
		queryFn: () => listCatalogFn()
	});
	const [makeId, setMakeId] = (0, import_react.useState)("");
	const [modelId, setModelId] = (0, import_react.useState)("");
	const [reg, setReg] = (0, import_react.useState)("");
	const models = (0, import_react.useMemo)(() => (catalog.data?.models ?? []).filter((m) => m.makeId === makeId), [catalog.data, makeId]);
	const selectedModel = models.find((m) => m.id === modelId);
	const create = useMutation({
		mutationFn: () => createCarFn({ data: {
			makeId,
			modelId,
			registrationNumber: reg
		} }),
		onSuccess: () => {
			toast.success("Automašīna pievienota");
			setReg("");
			qc.invalidateQueries({ queryKey: ["cars"] });
		},
		onError: (err) => toast.error(messageForError(err))
	});
	const remove = useMutation({
		mutationFn: (carId) => deleteCarFn({ data: { carId } }),
		onSuccess: () => {
			toast.success("Automašīna noņemta");
			qc.invalidateQueries({ queryKey: ["cars"] });
		},
		onError: (err) => toast.error(messageForError(err))
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-8 lg:grid-cols-[1fr_0.9fr]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs uppercase tracking-[0.2em] text-steel",
				children: "Garāža"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-2 font-display text-3xl font-semibold",
				children: "Manas automašīnas"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-md text-sm text-muted",
				children: "Kategoriju un cenu nosaka katalogs, nevis pārlūks."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 space-y-3",
				children: [(cars.data ?? []).length === 0 && !cars.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					className: "rounded-xl text-sm text-muted",
					children: "Pagaidām nav automašīnu. Pievieno pirmo, lai rezervētu laiku."
				}) : null, (cars.data ?? []).map((car) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "flex items-start justify-between gap-4 rounded-xl",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "font-medium",
							children: [
								car.makeName,
								" ",
								car.modelName
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 font-mono text-sm tracking-wide text-steel",
							children: car.registrationNumber
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-2 flex flex-wrap gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: "steel",
								children: CATEGORY_LABELS_LV[car.category] ?? car.category
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: formatEuro(getPriceCents(car.category)) })]
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "sm",
						onClick: () => remove.mutate(car.id),
						children: "Dzēst"
					})]
				}, car.id))]
			})
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
			className: "h-fit rounded-xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl font-semibold",
					children: "Pievienot auto"
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
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "make",
								children: "Marka"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								id: "make",
								className: "h-11 w-full rounded-md border border-border bg-bg-elevated px-3 text-sm",
								value: makeId,
								onChange: (e) => {
									setMakeId(e.target.value);
									setModelId("");
								},
								required: true,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: "Izvēlies marku"
								}), (catalog.data?.makes ?? []).map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: m.id,
									children: m.name
								}, m.id))]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "model",
								children: "Modelis"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								id: "model",
								className: "h-11 w-full rounded-md border border-border bg-bg-elevated px-3 text-sm",
								value: modelId,
								onChange: (e) => setModelId(e.target.value),
								required: true,
								disabled: !makeId,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: "Izvēlies modeli"
								}), models.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: m.id,
									children: m.name
								}, m.id))]
							})]
						}),
						selectedModel ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-muted",
							children: [
								"Kategorija: ",
								CATEGORY_LABELS_LV[selectedModel.category],
								" ·",
								" ",
								formatEuro(getPriceCents(selectedModel.category))
							]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "reg",
								children: "Reģistrācijas nr."
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "reg",
								value: reg,
								onChange: (e) => setReg(e.target.value.toUpperCase()),
								placeholder: "AB1234",
								required: true
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							className: "w-full",
							disabled: create.isPending,
							children: "Saglabāt"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					variant: "ghost",
					className: "mt-3 w-full",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/booking",
						children: "Tālāk uz rezervāciju"
					})
				})
			]
		})]
	});
}
//#endregion
export { CarsPage as component };
