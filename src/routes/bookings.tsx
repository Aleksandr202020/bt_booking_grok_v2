import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell, RequireAuth } from "@/components/layout/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatEuro, formatLvDate, isPastSlot } from "@/lib/booking/dates";
import { ACTIVE_BOOKING_STATUSES, messageForError } from "@/lib/booking/rules";
import { cancelBookingFn, listMyBookingsFn } from "@/server/functions";

export const Route = createFileRoute("/bookings")({ component: BookingsPage });

const STATUS_LABEL: Record<string, string> = {
  pending: "Gaida",
  confirmed: "Apstiprināta",
  completed: "Pabeigta",
  cancelled_customer: "Atcelta",
  cancelled_admin: "Atcelta (admin)",
  no_show: "Nepiedalījās",
};

function toneFor(status: string) {
  if (status === "confirmed" || status === "pending") return "ok" as const;
  if (status === "completed") return "steel" as const;
  if (status === "no_show") return "warn" as const;
  return "danger" as const;
}

function BookingsPage() {
  return (
    <RequireAuth>
      <AppShell>
        <BookingsBody />
      </AppShell>
    </RequireAuth>
  );
}

function BookingsBody() {
  const qc = useQueryClient();
  const bookings = useQuery({ queryKey: ["bookings"], queryFn: () => listMyBookingsFn() });
  const cancel = useMutation({
    mutationFn: (bookingId: string) => cancelBookingFn({ data: { bookingId } }),
    onSuccess: () => {
      toast.success("Rezervācija atcelta");
      void qc.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (err) => toast.error(messageForError(err)),
  });

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-steel">Grafiks</p>
      <h1 className="mt-2 font-display text-3xl font-semibold">Manas reizes</h1>
      <div className="mt-6 space-y-3">
        {(bookings.data ?? []).length === 0 && !bookings.isPending ? (
          <Card className="rounded-xl">
            <p className="text-sm text-muted">Vēl nav rezervāciju.</p>
            <Button asChild className="mt-4">
              <Link to="/booking">Rezervēt laiku</Link>
            </Button>
          </Card>
        ) : null}
        {(bookings.data ?? []).map((b) => {
          const cancellable =
            ACTIVE_BOOKING_STATUSES.includes(b.status as (typeof ACTIVE_BOOKING_STATUSES)[number]) &&
            !isPastSlot(b.bookingDate, b.bookingTime);
          return (
            <Card key={b.id} className="flex flex-col gap-3 rounded-xl sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-display text-lg font-semibold">
                  {formatLvDate(b.bookingDate)} · {b.bookingTime}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {b.makeName} {b.modelName} · {b.registrationNumber}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone={toneFor(b.status)}>{STATUS_LABEL[b.status] ?? b.status}</Badge>
                  <Badge>{formatEuro(b.priceCents)}</Badge>
                </div>
              </div>
              {cancellable ? (
                <Button
                  variant="danger"
                  onClick={() => cancel.mutate(b.id)}
                  disabled={cancel.isPending}
                >
                  Atcelt
                </Button>
              ) : null}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
