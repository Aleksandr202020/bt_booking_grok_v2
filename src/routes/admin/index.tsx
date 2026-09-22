import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { getRigaNowParts } from "@/lib/booking/dates";
import {
  adminAvailabilityFn,
  adminListBookingsFn,
  adminListClientsFn,
} from "@/server/functions";

export const Route = createFileRoute("/admin/")({ component: AdminHome });

function AdminHome() {
  const today = getRigaNowParts().date;
  const availability = useQuery({
    queryKey: ["admin-availability", today],
    queryFn: () => adminAvailabilityFn({ data: { date: today } }),
  });
  const bookings = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: () => adminListBookingsFn(),
  });
  const clients = useQuery({
    queryKey: ["admin-clients"],
    queryFn: () => adminListClientsFn(),
  });

  const slots = availability.data?.slots ?? [];
  const booked = slots.filter((s) => s.state === "booked").length;
  const blocked = slots.filter((s) => s.state === "blocked" || s.state === "holiday").length;
  const free = slots.filter((s) => s.state === "available").length;
  const banned = (clients.data ?? []).filter((c) => c.banned).length;

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Card className="rounded-xl">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">Šodien brīvi</p>
        <p className="mt-2 font-display text-4xl tabular-nums">{free}</p>
        <p className="mt-1 text-sm text-muted">
          {booked} aizņemti · {blocked} bloķēti
        </p>
        <Link to="/admin/calendar" className="mt-4 inline-block text-sm text-steel hover:text-fg">
          Atvērt kalendāru
        </Link>
      </Card>
      <Card className="rounded-xl">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">Rezervācijas</p>
        <p className="mt-2 font-display text-4xl tabular-nums">{bookings.data?.length ?? 0}</p>
        <Link to="/admin/bookings" className="mt-4 inline-block text-sm text-steel hover:text-fg">
          Skatīt visas
        </Link>
      </Card>
      <Card className="rounded-xl">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">Klienti</p>
        <p className="mt-2 font-display text-4xl tabular-nums">{clients.data?.length ?? 0}</p>
        <p className="mt-1 text-sm text-muted">{banned} bloķēti</p>
        <Link to="/admin/clients" className="mt-4 inline-block text-sm text-steel hover:text-fg">
          Ban / unban
        </Link>
      </Card>
    </div>
  );
}
