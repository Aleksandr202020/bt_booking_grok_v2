import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, RequireAuth } from "@/components/layout/shell";
import { getMyProfileFn } from "@/server/functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

const LINKS = [
  { to: "/admin", label: "Pārskats" },
  { to: "/admin/calendar", label: "Kalendārs" },
  { to: "/admin/bookings", label: "Rezervācijas" },
  { to: "/admin/manual", label: "Manuālā" },
  { to: "/admin/blocked", label: "Bloki" },
  { to: "/admin/clients", label: "Klienti" },
];

function AdminLayout() {
  return (
    <RequireAuth>
      <AppShell>
        <AdminGate />
      </AppShell>
    </RequireAuth>
  );
}

function AdminGate() {
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => getMyProfileFn() });
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (profile.isPending) {
    return <div className="h-40 animate-pulse rounded-xl bg-surface" />;
  }
  if (profile.data?.role !== "admin") {
    return (
      <div>
        <h1 className="font-display text-2xl font-semibold">Nav piekļuves</h1>
        <p className="mt-2 text-sm text-muted">Šī sadaļa ir tikai administratoram.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-steel">Admin</p>
      <h1 className="mt-2 font-display text-3xl font-semibold">Vadība</h1>
      <nav className="-mx-1 mt-5 flex gap-1 overflow-x-auto pb-2">
        {LINKS.map((link) => {
          const active =
            link.to === "/admin" ? pathname === "/admin" : pathname.startsWith(link.to);
          return (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-2 text-sm",
                active ? "bg-fg text-bg" : "text-muted hover:text-fg",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
}
