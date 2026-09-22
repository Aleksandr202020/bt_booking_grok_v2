import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { authClient, authEnabled } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { messageForError } from "@/lib/booking/rules";
import { updatePhoneFn } from "@/server/functions";

export const Route = createFileRoute("/register")({ component: Register });

function Register() {
  const { user, isPending } = useCurrentUserState();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!isPending && user) return <Navigate to="/booking" />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await authClient.signUp.email({ name, email, password });
      if (result.error) throw new Error(result.error.message ?? "REGISTER_FAILED");
      try {
        await updatePhoneFn({ data: { phone } });
      } catch {
        /* profile phone can be completed later */
      }
      window.location.href = "/booking";
    } catch (err) {
      setError(messageForError(err));
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-md">
        <p className="text-xs uppercase tracking-[0.2em] text-steel">Konts</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">Reģistrācija</h1>
        <p className="mt-2 text-sm text-muted">
          Jau ir konts?{" "}
          <Link to="/login" className="text-fg underline-offset-4 hover:underline">
            Ienākt
          </Link>
        </p>
        <Card className="mt-6 rounded-xl">
          {authEnabled ? (
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="name">Vārds</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  minLength={2}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-pasts</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Tālrunis</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+371 2xxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Parole</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error ? (
                <p className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>
              ) : null}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Veidoju kontu…" : "Izveidot kontu"}
              </Button>
            </form>
          ) : (
            <p className="text-sm text-muted">Reģistrācija ir izslēgta.</p>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
