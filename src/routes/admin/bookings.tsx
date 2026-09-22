import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatEuro, formatLvDate } from "@/lib/booking/dates";
import { BOOKING_STATUSES, messageForError } from "@/lib/booking/rules";
import { adminListBookingsFn, adminUpdateBookingFn } from "@/server/functions";

export const Route = createFileRoute("/admin/bookings")({ component: AdminBookings });

const STATUS_LABEL: Record<string, string> = {
  pending: "Gaida",
  confirmed: "Apstiprināta",
  completed: "Pabeigta",
  cancelled_customer: "Klients atcēla",
  cancelled_admin: "Admin atcēla",
  no_show: "Nepiedalījās",
};

function AdminBookings() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const bookings = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: () => adminListBookingsFn(),
  });
  const update = useMutation({
    mutationFn: (input: { bookingId: string; status: (typeof BOOKING_STATUSES)[number] }) =>
      adminUpdateBookingFn({ data: input }),
    onSuccess: () => {
      toast.success("Statuss atjaunināts");
      void qc.invalidateQueries({ queryKey: ["admin-bookings"] });
    },
    onError: (err) => toast.error(messageForError(err)),
  });

  const rows = (bookings.data ?? []).filter((b) => {
    const hay = `${b.customerName} ${b.customerPhone} ${b.registrationNumber} ${b.id}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Meklēt pēc vārda, tālruņa, numura"
        className="h-11 w-full max-w-md rounded-md border border-border bg-bg-elevated px-3 text-sm"
      />
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="py-2 pr-3">Datums</th>
              <th className="py-2 pr-3">Klients</th>
              <th className="py-2 pr-3">Auto</th>
              <th className="py-2 pr-3">Cena</th>
              <th className="py-2 pr-3">Statuss</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id} className="border-t border-border">
                <td className="py-3 pr-3">
                  <div className="font-medium">{formatLvDate(b.bookingDate)}</div>
                  <div className="tabular-nums text-muted">{b.bookingTime}</div>
                </td>
                <td className="py-3 pr-3">
                  <div>{b.customerName ?? "—"}</div>
                  <div className="text-muted">{b.customerPhone ?? b.customerEmail}</div>
                </td>
                <td className="py-3 pr-3">
                  <div>
                    {b.makeName} {b.modelName}
                  </div>
                  <div className="font-mono text-xs text-steel">{b.registrationNumber}</div>
                </td>
                <td className="py-3 pr-3 tabular-nums">{formatEuro(b.priceCents)}</td>
                <td className="py-3 pr-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{STATUS_LABEL[b.status] ?? b.status}</Badge>
                    <select
                      className="h-9 rounded-sm border border-border bg-bg-elevated px-2 text-xs"
                      value={b.status}
                      onChange={(e) =>
                        update.mutate({
                          bookingId: b.id,
                          status: e.target.value as (typeof BOOKING_STATUSES)[number],
                        })
                      }
                    >
                      {BOOKING_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s] ?? s}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <Card className="mt-4 rounded-xl text-sm text-muted">Nav rezervāciju.</Card>
        ) : null}
      </div>
      <Button
        variant="ghost"
        className="mt-3"
        onClick={() => void qc.invalidateQueries({ queryKey: ["admin-bookings"] })}
      >
        Atjaunot
      </Button>
    </div>
  );
}
