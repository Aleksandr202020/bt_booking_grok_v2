import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Droplets, Shield, Timer } from "lucide-react";
import { AppShell } from "@/components/layout/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <AppShell>
      <section className="grid gap-10 pb-8 pt-4 md:grid-cols-[1.3fr_0.7fr] md:items-end">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-steel">
            BT Automazgātava · Rīga
          </p>
          <h1 className="mt-4 max-w-xl font-display text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            Roku mazgāšana. Viens boks. Viena stunda.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted md:text-lg">
            Maksimālā kvalitāte ierobežotā laikā. Bez piemaksas par netīrību.
            Darba laiks 09:00–21:00.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/booking">Rezervēt laiku</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/login">Ienākt</Link>
            </Button>
          </div>
        </div>
        <Card className="rounded-xl p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Šodien</p>
          <p className="mt-3 font-display text-3xl font-semibold tabular-nums">
            09:00–21:00
          </p>
          <p className="mt-2 text-sm text-muted">12 stundu logi · 1 automašīna stundā</p>
          <div className="mt-6 grid grid-cols-3 gap-2">
            {["09", "13", "17"].map((h) => (
              <div
                key={h}
                className="rounded-md border border-border bg-bg-elevated px-3 py-3 text-center"
              >
                <div className="font-display text-lg tabular-nums">{h}:00</div>
                <div className="text-[11px] text-subtle">60 min</div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="mt-6 grid gap-3 md:grid-cols-3">
        {[
          { price: "25 €", title: "Pasažieru auto", note: "Standarta hatchback un sedans." },
          { price: "30 €", title: "Crossover / SUV", note: "Piemēram, Škoda Kamiq vai Opel Zafira." },
          { price: "35 €", title: "Minivans / komerc.", note: "V-Class, Caddy, Berlingo un līdzīgi." },
        ].map((tier) => (
          <Card key={tier.title} className="rounded-xl">
            <p className="font-display text-3xl font-semibold tabular-nums">{tier.price}</p>
            <h2 className="mt-3 text-lg font-medium">{tier.title}</h2>
            <p className="mt-1 text-sm text-muted">{tier.note}</p>
          </Card>
        ))}
      </section>

      <section className="mt-10 grid gap-3 md:grid-cols-4">
        {[
          { icon: Clock, title: "1. Automašīna", text: "Pievieno marku, modeli un numuru." },
          { icon: Timer, title: "2. Datums", text: "Izvēlies dienu nākamo 30 dienu logā." },
          { icon: Droplets, title: "3. Stunda", text: "Redzi brīvos, aizņemtos un bloķētos laikus." },
          { icon: Shield, title: "4. Apstiprinājums", text: "Cenu rēķina serveris pēc kategorijas." },
        ].map((step) => (
          <Card key={step.title} className="rounded-xl">
            <step.icon className="size-5 text-steel" />
            <h3 className="mt-4 text-sm font-medium">{step.title}</h3>
            <p className="mt-1 text-sm text-muted">{step.text}</p>
          </Card>
        ))}
      </section>
    </AppShell>
  );
}
