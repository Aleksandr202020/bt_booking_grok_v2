//#region node_modules/.nitro/vite/services/ssr/assets/pricing-D2q3Uz5_.js
var PRICE_CENTS = {
	passenger: 2500,
	crossover: 3e3,
	minivan: 3500,
	commercial: 3500
};
var CATEGORY_LABELS_LV = {
	passenger: "Pasažieru auto",
	crossover: "Crossover / SUV",
	minivan: "Minivans",
	commercial: "Komerctransports"
};
function getPriceCents(category) {
	if (category in PRICE_CENTS) return PRICE_CENTS[category];
	return PRICE_CENTS.passenger;
}
function isCarCategory(value) {
	return value in PRICE_CENTS;
}
//#endregion
export { getPriceCents as n, isCarCategory as r, CATEGORY_LABELS_LV as t };
