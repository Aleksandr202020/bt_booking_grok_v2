import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useQuery } from "@tanstack/react-query";
import { getMyProfileFn } from "@/server/functions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function Mark() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-md border border-border bg-surface font-display text-sm font-semibold tracking-tight text-fg">
        BT
      </span>
      <span className="leading-tight">
        <span className="block font-display text-sm font-semibold tracking-tight">
          Automazgātava
        </span>
        <span className="block text-[11px] uppercase tracking-[0.18em] text-muted">
          Rīga · 1 boks
        </span>
      </span>
    </Link>
  );
}

function NavLinks({ onClick, admin }: { onClick?: () => void; admin: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = [
    { to: "/booking", label: "Rezervēt" },
    { to: "/cars", label: "Automašīnas" },
    { to: "/bookings", label: "Manas reizes" },
    ...(admin ? [{ to: "/admin", label: "Admin" }] : []),
  ];
  return (
    <>
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onClick}
          className={cn(
            "rounded-sm px-3 py-2 text-sm transition-colors",
            pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to))
              ? "text-fg"
              : "text-muted hover:text-fg",
          )}
        >
          {item.label}
        </Link>
      ))}
    </>
  );
}

function AuthSlot() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return <div className="h-8 w-24 animate-pulse rounded-full bg-surface-2" />;
  }
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="secondary">
          <Link to="/register">Reģistrēties</Link>
        </Button>
        <Button asChild size="sm">
          <Link to="/login">Ienākt</Link>
        </Button>
      </div>
    );
  }
  return <UserButton />;
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user } = useCurrentUserState();
  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => getMyProfileFn(),
    enabled: Boolean(user),
  });
  const admin = profileQuery.data?.role === "admin";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Mark />
        <nav className="hidden items-center gap-1 md:flex">
          <NavLinks admin={admin} />
        </nav>
        <div className="flex items-center gap-2">
          <AuthSlot />
          <button
            type="button"
            className="grid size-11 place-items-center rounded-md border border-border md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Aizvērt izvēlni" : "Atvērt izvēlni"}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open ? (
        <div className="border-t border-border px-4 py-3 md:hidden">
          <nav className="flex flex-col">
            <NavLinks admin={admin} onClick={() => setOpen(false)} />
          </nav>
        </div>
      ) : null}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border py-8 text-center text-sm text-muted">
      <p>BT Automazgātava · viens boks · 09:00–21:00 · Rīga</p>
      <p className="mt-1 text-subtle">Maksimālā kvalitāte ierobežotā laikā.</p>
    </footer>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:py-12">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return (
      <AppShell>
        <div className="space-y-4">
          <div className="h-8 w-48 animate-pulse rounded-md bg-surface-2" />
          <div className="h-40 animate-pulse rounded-xl bg-surface" />
        </div>
      </AppShell>
    );
  }
  if (!user) {
    return <RedirectToSignIn />;
  }
  return <>{children}</>;
}
