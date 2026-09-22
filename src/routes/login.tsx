import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { messageForError } from "@/lib/booking/rules";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user, isPending } = useCurrentUserState();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!isPending && user) return <Navigate to="/booking" />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await authClient.signIn.email({ email, password });
      if (result.error) throw new Error(result.error.message ?? "LOGIN_FAILED");
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
        <h1 className="mt-2 font-display text-3xl font-semibold">Ienākt</h1>
        <p className="mt-2 text-sm text-muted">
          Rezervācijai nepieciešams konts. Jauns klients?{" "}
          <Link to="/register" className="text-fg underline-offset-4 hover:underline">
            Reģistrēties
          </Link>
        </p>
        <Card className="mt-6 rounded-xl">
          {authEnabled ? (
            <div className="space-y-3">
              {GROK_PROVIDERS.map((p) => (
                <Button
                  key={p.providerId}
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={() => signIn(p.providerId, { callbackURL: "/booking" })}
                >
                  Turpināt ar {p.label}
                </Button>
              ))}
              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-subtle">vai e-pasts</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <form onSubmit={onSubmit} className="space-y-3">
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
                  <Label htmlFor="password">Parole</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {error ? (
                  <p className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>
                ) : null}
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Pieslēdzos…" : "Ienākt"}
                </Button>
              </form>
            </div>
          ) : (
            <p className="text-sm text-muted">Ielogošanās ir izslēgta.</p>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
