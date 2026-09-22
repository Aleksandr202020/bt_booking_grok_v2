import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { addCalendarDays, formatEuro, formatLvDate, getRigaNowParts } from "@/lib/booking/dates";
import { cn } from "@/lib/utils";
import { adminAvailabilityFn } from "@/server/functions";

export const Route = createFileRoute("/admin/calendar")({ component: AdminCalendar });

function AdminCalendar() {
  const today = getRigaNowParts().date;
  const [date, setDate] = useState(today);
  const availability = useQuery({
    queryKey: ["admin-availability", date],
    queryFn: () => adminAvailabilityFn({ data: { date } }),
  });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-11 rounded-md border border-border bg-bg-elevated px-3 text-sm"
        />
        <button
          type="button"
          className="text-sm text-muted hover:text-fg"
          onClick={() => setDate(addCalendarDays(date, -1))}
        >
          Iepriekšējā
        </button>
        <button
          type="button"
          className="text-sm text-muted hover:text-fg"
          onClick={() => setDate(addCalendarDays(date, 1))}
        >
          Nākamā
        </button>
        <span className="text-sm text-muted">{formatLvDate(date)}</span>
        {availability.data?.holiday ? (
          <Badge tone="danger">{availability.data.holiday}</Badge>
        ) : null}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {(availability.data?.slots ?? []).map((slot) => (
          <Card
            key={slot.time}
            className={cn(
              "rounded-lg p-4",
              slot.state === "available" && "border-ok/30 bg-ok-bg",
              slot.state === "booked" && "border-warn/30 bg-warn-bg",
              (slot.state === "blocked" || slot.state === "holiday") && "border-danger/30 bg-danger-bg",
            )}
          >
            <div className="flex items-center justify-between">
              <p className="font-display text-xl tabular-nums">{slot.time}</p>
              <Badge
                tone={
                  slot.state === "available"
                    ? "ok"
                    : slot.state === "booked"
                      ? "warn"
                      : "danger"
                }
              >
                {slot.state}
              </Badge>
            </div>
            {slot.customerName ? (
              <p className="mt-2 text-sm">{slot.customerName}</p>
            ) : null}
            {slot.registrationNumber ? (
              <p className="font-mono text-xs text-muted">{slot.registrationNumber}</p>
            ) : null}
            {slot.priceCents ? (
              <p className="mt-1 text-sm tabular-nums">{formatEuro(slot.priceCents)}</p>
            ) : null}
            {slot.reason ? <p className="mt-1 text-xs text-muted">{slot.reason}</p> : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
