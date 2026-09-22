import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell, RequireAuth } from "@/components/layout/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addCalendarDays, formatEuro, formatLvDate, getRigaNowParts } from "@/lib/booking/dates";
import { CATEGORY_LABELS_LV, getPriceCents } from "@/lib/booking/pricing";
import { CUSTOMER_WINDOW_DAYS, messageForError, type CarCategory } from "@/lib/booking/rules";
import { cn } from "@/lib/utils";
import {
  createBookingFn,
  getAvailabilityFn,
  getMyProfileFn,
  listMyCarsFn,
  updatePhoneFn,
} from "@/server/functions";

export const Route = createFileRoute("/booking")({ component: BookingPage });

function BookingPage() {
  return (
    <RequireAuth>
      <AppShell>
        <BookingBody />
      </AppShell>
    </RequireAuth>
  );
}

function BookingBody() {
  const qc = useQueryClient();
  const today = getRigaNowParts().date;
  const maxDate = addCalendarDays(today, CUSTOMER_WINDOW_DAYS);
  const [carId, setCarId] = useState("");
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("");
  const [phoneDraft, setPhoneDraft] = useState("");

  const profile = useQuery({ queryKey: ["profile"], queryFn: () => getMyProfileFn() });
  const cars = useQuery({ queryKey: ["cars"], queryFn: () => listMyCarsFn() });
  const availability = useQuery({
    queryKey: ["availability", date],
    queryFn: () => getAvailabilityFn({ data: { date } }),
    enabled: Boolean(date),
  });

  const selectedCar = (cars.data ?? []).find((c) => c.id === carId);
  const price = selectedCar ? getPriceCents(selectedCar.category) : null;

  const dates = useMemo(() => {
    return Array.from({ length: CUSTOMER_WINDOW_DAYS + 1 }, (_, i) =>
      addCalendarDays(today, i),
    );
  }, [today]);

  const savePhone = useMutation({
    mutationFn: () => updatePhoneFn({ data: { phone: phoneDraft } }),
    onSuccess: () => {
      toast.success("Tālrunis saglabāts");
      void qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (err) => toast.error(messageForError(err)),
  });

  const book = useMutation({
    mutationFn: () =>
      createBookingFn({
        data: { carId, bookingDate: date, bookingTime: time },
      }),
    onSuccess: () => {
      toast.success("Rezervācija apstiprināta");
      setTime("");
      void qc.invalidateQueries({ queryKey: ["availability"] });
      void qc.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (err) => toast.error(messageForError(err)),
  });

  if (profile.data?.banned) {
    return (
      <Card className="rounded-xl">
        <h1 className="font-display text-2xl font-semibold">Konts ir bloķēts</h1>
        <p className="mt-2 text-sm text-muted">
          Jaunas rezervācijas nav iespējamas. Esošās reizes joprojām var atcelt.
        </p>
        <Button asChild className="mt-4">
          <Link to="/bookings">Manas reizes</Link>
        </Button>
      </Card>
    );
  }

  if (profile.data && !profile.data.phone) {
    return (
      <Card className="mx-auto max-w-md rounded-xl">
        <h1 className="font-display text-2xl font-semibold">Tālrunis</h1>
        <p className="mt-2 text-sm text-muted">
          Rezervācijai nepieciešams tālruņa numurs, lai varam sazināties.
        </p>
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            savePhone.mutate();
          }}
        >
          <Label htmlFor="phone">Numurs</Label>
          <Input
            id="phone"
            value={phoneDraft}
            onChange={(e) => setPhoneDraft(e.target.value)}
            placeholder="+371 2xxxxxxx"
            required
          />
          <Button type="submit" className="w-full" disabled={savePhone.isPending}>
            Saglabāt un turpināt
          </Button>
        </form>
      </Card>
    );
  }

  if ((cars.data ?? []).length === 0 && !cars.isPending) {
    return (
      <Card className="rounded-xl">
        <h1 className="font-display text-2xl font-semibold">Vispirms automašīna</h1>
        <p className="mt-2 text-sm text-muted">
          Lai rezervētu boksā vietu, pievieno vismaz vienu auto no kataloga.
        </p>
        <Button asChild className="mt-4">
          <Link to="/cars">Pievienot auto</Link>
        </Button>
      </Card>
    );
  }

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-steel">Rezervācija</p>
      <h1 className="mt-2 font-display text-3xl font-semibold md:text-4xl">
        Izvēlies stundu
      </h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Viens boks. Brīvais laiks pārlūkā nav garantija — vietu apstiprina datubāze.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <Card className="rounded-xl">
            <Label htmlFor="car">Automašīna</Label>
            <select
              id="car"
              className="mt-2 h-11 w-full rounded-md border border-border bg-bg-elevated px-3 text-sm"
              value={carId}
              onChange={(e) => setCarId(e.target.value)}
            >
              <option value="">Izvēlies auto</option>
              {(cars.data ?? []).map((car) => (
                <option key={car.id} value={car.id}>
                  {car.makeName} {car.modelName} · {car.registrationNumber}
                </option>
              ))}
            </select>
            {selectedCar ? (
              <p className="mt-3 text-sm text-muted">
                {CATEGORY_LABELS_LV[selectedCar.category as CarCategory]} ·{" "}
                <span className="text-fg tabular-nums">{formatEuro(price ?? 0)}</span>
              </p>
            ) : null}
          </Card>

          <Card className="rounded-xl">
            <Label htmlFor="date">Datums</Label>
            <input
              id="date"
              type="date"
              min={today}
              max={maxDate}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setTime("");
              }}
              className="mt-2 h-11 w-full rounded-md border border-border bg-bg-elevated px-3 text-sm"
            />
            <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto pb-1">
              {dates.slice(0, 10).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setDate(d);
                    setTime("");
                  }}
                  className={cn(
                    "min-w-16 rounded-md border px-2 py-2 text-center text-xs",
                    d === date
                      ? "border-fg bg-fg text-bg"
                      : "border-border text-muted hover:text-fg",
                  )}
                >
                  {formatLvDate(d).split(" ")[0]}
                  <span className="mt-1 block tabular-nums">{d.slice(8)}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <Card className="rounded-xl">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">{formatLvDate(date)}</h2>
            {availability.data?.holiday ? (
              <Badge tone="danger">{availability.data.holiday}</Badge>
            ) : null}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(availability.data?.slots ?? []).map((slot) => {
              const selectable = slot.available && Boolean(carId);
              return (
                <button
                  key={slot.time}
                  type="button"
                  disabled={!selectable}
                  onClick={() => setTime(slot.time)}
                  className={cn(
                    "min-h-16 rounded-md border px-3 py-3 text-left transition-colors",
                    time === slot.time
                      ? "border-fg bg-fg text-bg"
                      : slot.available
                        ? "border-ok/40 bg-ok-bg text-fg hover:border-ok"
                        : "border-border bg-bg-elevated text-subtle",
                  )}
                >
                  <div className="font-display text-lg tabular-nums">{slot.time}</div>
                  <div className="mt-0.5 text-[11px] uppercase tracking-wide">
                    {slot.state === "available"
                      ? "Brīvs"
                      : slot.state === "booked"
                        ? "Aizņemts"
                        : slot.state === "blocked"
                          ? "Bloķēts"
                          : slot.state === "holiday"
                            ? "Svētki"
                            : slot.state === "past"
                              ? "Pagājis"
                              : "Ārpus loga"}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted">
                {time ? `${date} · ${time}–${String(Number(time.slice(0, 2)) + 1).padStart(2, "0")}:00` : "Izvēlies laiku"}
              </p>
              <p className="font-display text-2xl font-semibold tabular-nums">
                {price != null ? formatEuro(price) : "—"}
              </p>
            </div>
            <Button
              size="lg"
              disabled={!carId || !time || book.isPending}
              onClick={() => book.mutate()}
            >
              {book.isPending ? "Apstiprinu…" : "Apstiprināt"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
