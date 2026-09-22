import { o as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { l as messageForError } from "./middleware-CDYsiKlx.mjs";
import { _ as getMyProfileFn, b as listMyCarsFn, f as cn, g as getAvailabilityFn, p as createBookingFn, x as updatePhoneFn } from "./functions-PbePFcDc.mjs";
import { t as Card } from "./card-Dsq3FXOV.mjs";
import { a as getRigaNowParts, i as formatLvDate, r as formatEuro, t as addCalendarDays } from "./dates-DHkzvHRL.mjs";
import { t as Button } from "./button-DFtBDFjg.mjs";
import { t as Input } from "./input-CpDUXnaQ.mjs";
import { t as Label } from "./label-Dc6zNc_X.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as Badge } from "./badge-D51PCq8e.mjs";
import { n as RequireAuth, t as AppShell } from "./shell-BdYsgFSr.mjs";
import { n as getPriceCents, t as CATEGORY_LABELS_LV } from "./pricing-D2q3Uz5_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/booking-C3hhJGHe.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function BookingPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RequireAuth, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookingBody, {}) }) });
}
function BookingBody() {
	const qc = useQueryClient();
	const today = getRigaNowParts().date;
	const maxDate = addCalendarDays(today, 30);
	const [carId, setCarId] = (0, import_react.useState)("");
	const [date, setDate] = (0, import_react.useState)(today);
	const [time, setTime] = (0, import_react.useState)("");
	const [phoneDraft, setPhoneDraft] = (0, import_react.useState)("");
	const profile = useQuery({
		queryKey: ["profile"],
		queryFn: () => getMyProfileFn()
	});
	const cars = useQuery({
		queryKey: ["cars"],
		queryFn: () => listMyCarsFn()
	});
	const availability = useQuery({
		queryKey: ["availability", date],
		queryFn: () => getAvailabilityFn({ data: { date } }),
		enabled: Boolean(date)
	});
	const selectedCar = (cars.data ?? []).find((c) => c.id === carId);
	const price = selectedCar ? getPriceCents(selectedCar.category) : null;
	const dates = (0, import_react.useMemo)(() => {
		return Array.from({ length: 31 }, (_, i) => addCalendarDays(today, i));
	}, [today]);
	const savePhone = useMutation({
		mutationFn: () => updatePhoneFn({ data: { phone: phoneDraft } }),
		onSuccess: () => {
			toast.success("Tālrunis saglabāts");
			qc.invalidateQueries({ queryKey: ["profile"] });
		},
		onError: (err) => toast.error(messageForError(err))
	});
	const book = useMutation({
		mutationFn: () => createBookingFn({ data: {
			carId,
			bookingDate: date,
			bookingTime: time
		} }),
		onSuccess: () => {
			toast.success("Rezervācija apstiprināta");
			setTime("");
			qc.invalidateQueries({ queryKey: ["availability"] });
			qc.invalidateQueries({ queryKey: ["bookings"] });
		},
		onError: (err) => toast.error(messageForError(err))
	});
	if (profile.data?.banned) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		className: "rounded-xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-2xl font-semibold",
				children: "Konts ir bloķēts"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: "Jaunas rezervācijas nav iespējamas. Esošās reizes joprojām var atcelt."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				className: "mt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/bookings",
					children: "Manas reizes"
				})
			})
		]
	});
	if (profile.data && !profile.data.phone) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		className: "mx-auto max-w-md rounded-xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-2xl font-semibold",
				children: "Tālrunis"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: "Rezervācijai nepieciešams tālruņa numurs, lai varam sazināties."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-4 space-y-3",
				onSubmit: (e) => {
					e.preventDefault();
					savePhone.mutate();
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
						htmlFor: "phone",
						children: "Numurs"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						id: "phone",
						value: phoneDraft,
						onChange: (e) => setPhoneDraft(e.target.value),
						placeholder: "+371 2xxxxxxx",
						required: true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						className: "w-full",
						disabled: savePhone.isPending,
						children: "Saglabāt un turpināt"
					})
				]
			})
		]
	});
	if ((cars.data ?? []).length === 0 && !cars.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		className: "rounded-xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-2xl font-semibold",
				children: "Vispirms automašīna"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted",
				children: "Lai rezervētu boksā vietu, pievieno vismaz vienu auto no kataloga."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				asChild: true,
				className: "mt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/cars",
					children: "Pievienot auto"
				})
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs uppercase tracking-[0.2em] text-steel",
			children: "Rezervācija"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "mt-2 font-display text-3xl font-semibold md:text-4xl",
			children: "Izvēlies stundu"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 max-w-xl text-sm text-muted",
			children: "Viens boks. Brīvais laiks pārlūkā nav garantija — vietu apstiprina datubāze."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "rounded-xl",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "car",
							children: "Automašīna"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							id: "car",
							className: "mt-2 h-11 w-full rounded-md border border-border bg-bg-elevated px-3 text-sm",
							value: carId,
							onChange: (e) => setCarId(e.target.value),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "",
								children: "Izvēlies auto"
							}), (cars.data ?? []).map((car) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
								value: car.id,
								children: [
									car.makeName,
									" ",
									car.modelName,
									" · ",
									car.registrationNumber
								]
							}, car.id))]
						}),
						selectedCar ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 text-sm text-muted",
							children: [
								CATEGORY_LABELS_LV[selectedCar.category],
								" ·",
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-fg tabular-nums",
									children: formatEuro(price ?? 0)
								})
							]
						}) : null
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					className: "rounded-xl",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "date",
							children: "Datums"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							id: "date",
							type: "date",
							min: today,
							max: maxDate,
							value: date,
							onChange: (e) => {
								setDate(e.target.value);
								setTime("");
							},
							className: "mt-2 h-11 w-full rounded-md border border-border bg-bg-elevated px-3 text-sm"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "-mx-1 mt-3 flex gap-2 overflow-x-auto pb-1",
							children: dates.slice(0, 10).map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => {
									setDate(d);
									setTime("");
								},
								className: cn("min-w-16 rounded-md border px-2 py-2 text-center text-xs", d === date ? "border-fg bg-fg text-bg" : "border-border text-muted hover:text-fg"),
								children: [formatLvDate(d).split(" ")[0], /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mt-1 block tabular-nums",
									children: d.slice(8)
								})]
							}, d))
						})
					]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "rounded-xl",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-xl font-semibold",
							children: formatLvDate(date)
						}), availability.data?.holiday ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: "danger",
							children: availability.data.holiday
						}) : null]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3",
						children: (availability.data?.slots ?? []).map((slot) => {
							const selectable = slot.available && Boolean(carId);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								disabled: !selectable,
								onClick: () => setTime(slot.time),
								className: cn("min-h-16 rounded-md border px-3 py-3 text-left transition-colors", time === slot.time ? "border-fg bg-fg text-bg" : slot.available ? "border-ok/40 bg-ok-bg text-fg hover:border-ok" : "border-border bg-bg-elevated text-subtle"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "font-display text-lg tabular-nums",
									children: slot.time
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-0.5 text-[11px] uppercase tracking-wide",
									children: slot.state === "available" ? "Brīvs" : slot.state === "booked" ? "Aizņemts" : slot.state === "blocked" ? "Bloķēts" : slot.state === "holiday" ? "Svētki" : slot.state === "past" ? "Pagājis" : "Ārpus loga"
								})]
							}, slot.time);
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted",
							children: time ? `${date} · ${time}–${String(Number(time.slice(0, 2)) + 1).padStart(2, "0")}:00` : "Izvēlies laiku"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-2xl font-semibold tabular-nums",
							children: price != null ? formatEuro(price) : "—"
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "lg",
							disabled: !carId || !time || book.isPending,
							onClick: () => book.mutate(),
							children: book.isPending ? "Apstiprinu…" : "Apstiprināt"
						})]
					})
				]
			})]
		})
	] });
}
//#endregion
export { BookingPage as component };
