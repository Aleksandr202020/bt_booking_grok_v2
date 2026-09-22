import { a as getServerFnById, i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { i as BOOKING_STATUSES, s as authMiddleware } from "./middleware-CDYsiKlx.mjs";
import { cn as _enum, dn as boolean, gn as object, yn as string } from "../_libs/@better-auth/core+[...].mjs";
import { n as clsx } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/functions-PbePFcDc.js
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var dateSchema = string().regex(/^\d{4}-\d{2}-\d{2}$/);
var timeSchema = string().regex(/^\d{2}:00$/);
var idSchema = string().min(1).max(80);
var phoneSchema = string().trim().min(8).max(20);
var notesSchema = string().trim().max(1e3).optional().nullable();
var getMyProfileFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("1f890bc3a717109e6e4cec9b0b65db18200e0c344e8a72697a0af2e7e57331ff"));
var updatePhoneFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ phone: phoneSchema }).parse(input)).handler(createSsrRpc("e550da60c6d8165a63c846a3562cee7ca8ae1c2dc7170aa0d861622537d8d296"));
var listCatalogFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("3210fcb4d468d1f927d4e176306bdf0574204932f65cfae10a9b55e5cdb7b27f"));
var listMyCarsFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("93007f490b027e39d8f94cd186a6a474add59be98cc695fda3ae1a745159eb10"));
var createCarFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	makeId: idSchema,
	modelId: idSchema,
	registrationNumber: string().trim().min(2).max(20)
}).parse(input)).handler(createSsrRpc("f1903b764ddaee2367ea2a48bb68093e790c110f12f93e82458b746735416106"));
var deleteCarFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ carId: idSchema }).parse(input)).handler(createSsrRpc("bbbd61ae1d64cddd7ae99dff527c1c62f98a183c8a100a2aa6c5fdff034539b7"));
var getAvailabilityFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => object({ date: dateSchema }).parse(input)).handler(createSsrRpc("05a05beebe63b87f50694fe65bbbe29cd223fce0b34ae78d6462518fa638a2f9"));
createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => object({ carId: idSchema }).parse(input)).handler(createSsrRpc("c4ed827d199f4e491c9ecf7627d9e5b2fad5bc1ce3baa73dc4f2584a88fbf1aa"));
var createBookingFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	carId: idSchema,
	bookingDate: dateSchema,
	bookingTime: timeSchema,
	notes: notesSchema
}).parse(input)).handler(createSsrRpc("971c73723c3f11eb0abb8cd1b96dd26a47cb3b064efc69a173832a173d92cca5"));
var listMyBookingsFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("8fd8b7290aa4a0bfc0998d7b161c8d34a91d553bbf71a2a2a271842b61f173e8"));
var cancelBookingFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ bookingId: idSchema }).parse(input)).handler(createSsrRpc("1996da21c4afdb8c00588e1997d6735d2e04337ad2df37730e19a580662ddb79"));
var adminAvailabilityFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => object({ date: dateSchema }).parse(input)).handler(createSsrRpc("f62d189944eeafc826c33a0f616033b5355d4e2a3720bdb43e7036cd5815bfa9"));
var adminListBookingsFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("cb211b92fe43727de91be18253aaa53d9570cab7bb8db9079a4961ca6e7e378d"));
var adminCreateBookingFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	userId: idSchema,
	carId: idSchema,
	bookingDate: dateSchema,
	bookingTime: timeSchema,
	notes: notesSchema
}).parse(input)).handler(createSsrRpc("31570fabc9217fd17633df2971cde0b9d24d934cf98feb62193f818e1584f7a0"));
var adminUpdateBookingFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	bookingId: idSchema,
	bookingDate: dateSchema.optional(),
	bookingTime: timeSchema.optional(),
	carId: idSchema.optional(),
	status: _enum(BOOKING_STATUSES).optional(),
	notes: notesSchema
}).parse(input)).handler(createSsrRpc("d3de33bd66f97123b1fc736a28802e1d85c380a9cacccd840ca4ae33a89c75ba"));
var adminListBlockedFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("c945fd3f2460e755ec5782a3c289a26e0b49c1689dac4afb1a2ca95386de27c3"));
var adminCreateBlockedFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	bookingDate: dateSchema,
	bookingTime: timeSchema.nullable(),
	reason: string().trim().min(1).max(300)
}).parse(input)).handler(createSsrRpc("026cc88ecb02bfabbc4031d5eca20d9014df18cd322215939d3849a72c82c892"));
var adminDeleteBlockedFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({ id: idSchema }).parse(input)).handler(createSsrRpc("a47405307fa3c500a8331c75ec8a5d9fdfe80cd3358f56347cb31ea694553df5"));
var adminListClientsFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("3732eb74260e4311d781d4d6ade8750b2ff7951a8bcbf429f4c7af18f199f8da"));
var adminSetBannedFn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => object({
	userId: idSchema,
	banned: boolean(),
	reason: string().trim().max(300).optional()
}).parse(input)).handler(createSsrRpc("47dbf4a5bc01ef86abb955945435bb6c7f4723f4a7089c35662a1dab9ca43f2b"));
createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("860e920e0ef8eea501fb0aaa0026375055d41f41591f06a90f8b07a9472267db"));
createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("a0c09986174e4b6f2a87d05a0b477f8c00cd5de9b50582a411ac9fc5b4a2d138"));
var adminListClientCarsFn = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => object({ userId: idSchema }).parse(input)).handler(createSsrRpc("89ace130793279ceb5acb0291059362f3f866e6a396a2129c95526b6bd7aa112"));
//#endregion
export { getMyProfileFn as _, adminListBlockedFn as a, listMyCarsFn as b, adminListClientsFn as c, cancelBookingFn as d, cn as f, getAvailabilityFn as g, deleteCarFn as h, adminDeleteBlockedFn as i, adminSetBannedFn as l, createCarFn as m, adminCreateBlockedFn as n, adminListBookingsFn as o, createBookingFn as p, adminCreateBookingFn as r, adminListClientCarsFn as s, adminAvailabilityFn as t, adminUpdateBookingFn as u, listCatalogFn as v, updatePhoneFn as x, listMyBookingsFn as y };
