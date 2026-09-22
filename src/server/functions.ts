import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { BOOKING_STATUSES } from "@/lib/booking/rules";
import {
  adminUpdateBooking,
  cancelCustomerBooking,
  createBlockedSlot,
  createBooking,
  createCar,
  deleteBlockedSlot,
  deleteCar,
  getProfileForUser,
  getSlotAvailability,
  listAdminBookings,
  listAudit,
  listBlockedSlots,
  listCarsForUser,
  listCatalog,
  listClients,
  listHolidays,
  listMyBookings,
  quotePriceForCar,
  requireAdmin,
  setBanned,
  updatePhone,
} from "./engine";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeSchema = z.string().regex(/^\d{2}:00$/);
const idSchema = z.string().min(1).max(80);
const phoneSchema = z.string().trim().min(8).max(20);
const notesSchema = z.string().trim().max(1000).optional().nullable();

export const getMyProfileFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => getProfileForUser(context.userId));

export const updatePhoneFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ phone: phoneSchema }).parse(input))
  .handler(async ({ context, data }) => updatePhone(context.userId, data.phone));

export const listCatalogFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => listCatalog());

export const listMyCarsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => listCarsForUser(context.userId));

export const createCarFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        makeId: idSchema,
        modelId: idSchema,
        registrationNumber: z.string().trim().min(2).max(20),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) =>
    createCar({
      userId: context.userId,
      makeId: data.makeId,
      modelId: data.modelId,
      registrationNumber: data.registrationNumber,
    }),
  );

export const deleteCarFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ carId: idSchema }).parse(input))
  .handler(async ({ context, data }) => {
    await deleteCar(context.userId, data.carId);
    return { ok: true };
  });

export const getAvailabilityFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ date: dateSchema }).parse(input))
  .handler(async ({ context, data }) => {
    const profile = await getProfileForUser(context.userId);
    return getSlotAvailability(data.date, {
      role: profile.role === "admin" ? "admin" : "customer",
    });
  });

export const quotePriceFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ carId: idSchema }).parse(input))
  .handler(async ({ context, data }) => quotePriceForCar(context.userId, data.carId));

export const createBookingFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        carId: idSchema,
        bookingDate: dateSchema,
        bookingTime: timeSchema,
        notes: notesSchema,
      })
      .parse(input),
  )
  .handler(async ({ context, data }) =>
    createBooking({
      actorId: context.userId,
      userId: context.userId,
      carId: data.carId,
      bookingDate: data.bookingDate,
      bookingTime: data.bookingTime,
      notes: data.notes,
      isAdmin: false,
    }),
  );

export const listMyBookingsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => listMyBookings(context.userId));

export const cancelBookingFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ bookingId: idSchema }).parse(input))
  .handler(async ({ context, data }) =>
    cancelCustomerBooking(context.userId, data.bookingId),
  );

export const adminAvailabilityFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ date: dateSchema }).parse(input))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    return getSlotAvailability(data.date, { role: "admin" });
  });

export const adminListBookingsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    return listAdminBookings();
  });

export const adminCreateBookingFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        userId: idSchema,
        carId: idSchema,
        bookingDate: dateSchema,
        bookingTime: timeSchema,
        notes: notesSchema,
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    return createBooking({
      actorId: context.userId,
      userId: data.userId,
      carId: data.carId,
      bookingDate: data.bookingDate,
      bookingTime: data.bookingTime,
      notes: data.notes,
      isAdmin: true,
    });
  });

export const adminUpdateBookingFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        bookingId: idSchema,
        bookingDate: dateSchema.optional(),
        bookingTime: timeSchema.optional(),
        carId: idSchema.optional(),
        status: z.enum(BOOKING_STATUSES).optional(),
        notes: notesSchema,
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    return adminUpdateBooking({ actorId: context.userId, ...data });
  });

export const adminListBlockedFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    return listBlockedSlots();
  });

export const adminCreateBlockedFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        bookingDate: dateSchema,
        bookingTime: timeSchema.nullable(),
        reason: z.string().trim().min(1).max(300),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    return createBlockedSlot({
      actorId: context.userId,
      bookingDate: data.bookingDate,
      bookingTime: data.bookingTime,
      reason: data.reason,
    });
  });

export const adminDeleteBlockedFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ id: idSchema }).parse(input))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    await deleteBlockedSlot(context.userId, data.id);
    return { ok: true };
  });

export const adminListClientsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    return listClients();
  });

export const adminSetBannedFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        userId: idSchema,
        banned: z.boolean(),
        reason: z.string().trim().max(300).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    await setBanned({
      actorId: context.userId,
      userId: data.userId,
      banned: data.banned,
      reason: data.reason,
    });
    return { ok: true };
  });

export const adminListHolidaysFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    return listHolidays();
  });

export const adminListAuditFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId);
    return listAudit();
  });

export const adminListClientCarsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: unknown) => z.object({ userId: idSchema }).parse(input))
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId);
    return listCarsForUser(data.userId);
  });
