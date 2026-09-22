import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { getRigaNowParts } from "@/lib/booking/dates";
import { WORKING_SLOTS, messageForError } from "@/lib/booking/rules";
import {
  adminAvailabilityFn,
  adminCreateBookingFn,
  adminListClientCarsFn,
  adminListClientsFn,
} from "@/server/functions";

export const Route = createFileRoute("/admin/manual")({ component: ManualBooking });

function ManualBooking() {
  const qc = useQueryClient();
  const today = getRigaNowParts().date;
  const [userId, setUserId] = useState("");
  const [carId, setCarId] = useState("");
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("");

  const clients = useQuery({ queryKey: ["admin-clients"], queryFn: () => adminListClientsFn() });
  const cars = useQuery({
    queryKey: ["admin-client-cars", userId],
    queryFn: () => adminListClientCarsFn({ data: { userId } }),
    enabled: Boolean(userId),
  });
  const availability = useQuery({
    queryKey: ["admin-availability", date],
    queryFn: () => adminAvailabilityFn({ data: { date } }),
  });

  const create = useMutation({
    mutationFn: () =>
      adminCreateBookingFn({
        data: { userId, carId, bookingDate: date, bookingTime: time },
      }),
    onSuccess: () => {
      toast.success("Manuālā rezervācija izveidota");
      setTime("");
      void qc.invalidateQueries({ queryKey: ["admin-availability"] });
      void qc.invalidateQueries({ queryKey: ["admin-bookings"] });
    },
    onError: (err) => toast.error(messageForError(err)),
  });

  return (
    <Card className="max-w-lg rounded-xl">
      <h2 className="font-display text-xl font-semibold">Rezervācija pa tālruni</h2>
      <p className="mt-1 text-sm text-muted">
        Tās pašas servera pārbaudes: svētki, bloki, konflikti, kategorija, cena.
      </p>
      <form
        className="mt-4 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <div className="space-y-1.5">
          <Label>Klients</Label>
          <select
            className="h-11 w-full rounded-md border border-border bg-bg-elevated px-3 text-sm"
            value={userId}
            onChange={(e) => {
              setUserId(e.target.value);
              setCarId("");
            }}
            required
          >
            <option value="">Izvēlies klientu</option>
            {(clients.data ?? []).map((c) => (
              <option key={c.userId} value={c.userId}>
                {c.name ?? c.email} {c.phone ? `· ${c.phone}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Auto</Label>
          <select
            className="h-11 w-full rounded-md border border-border bg-bg-elevated px-3 text-sm"
            value={carId}
            onChange={(e) => setCarId(e.target.value)}
            required
            disabled={!userId}
          >
            <option value="">Izvēlies auto</option>
            {(cars.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.makeName} {c.modelName} · {c.registrationNumber}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Datums</Label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-11 w-full rounded-md border border-border bg-bg-elevated px-3 text-sm"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Laiks</Label>
          <select
            className="h-11 w-full rounded-md border border-border bg-bg-elevated px-3 text-sm"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          >
            <option value="">Stunda</option>
            {WORKING_SLOTS.map((slot) => {
              const state = availability.data?.slots.find((s) => s.time === slot)?.state;
              return (
                <option key={slot} value={slot} disabled={state && state !== "available"}>
                  {slot} {state && state !== "available" ? `· ${state}` : ""}
                </option>
              );
            })}
          </select>
        </div>
        <Button type="submit" className="w-full" disabled={create.isPending}>
          Izveidot
        </Button>
      </form>
    </Card>
  );
}
