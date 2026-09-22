import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell, RequireAuth } from "@/components/layout/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CATEGORY_LABELS_LV, getPriceCents } from "@/lib/booking/pricing";
import { formatEuro } from "@/lib/booking/dates";
import { messageForError } from "@/lib/booking/rules";
import type { CarCategory } from "@/lib/booking/rules";
import {
  createCarFn,
  deleteCarFn,
  listCatalogFn,
  listMyCarsFn,
} from "@/server/functions";

export const Route = createFileRoute("/cars")({ component: CarsPage });

function CarsPage() {
  return (
    <RequireAuth>
      <AppShell>
        <CarsBody />
      </AppShell>
    </RequireAuth>
  );
}

function CarsBody() {
  const qc = useQueryClient();
  const cars = useQuery({ queryKey: ["cars"], queryFn: () => listMyCarsFn() });
  const catalog = useQuery({ queryKey: ["catalog"], queryFn: () => listCatalogFn() });
  const [makeId, setMakeId] = useState("");
  const [modelId, setModelId] = useState("");
  const [reg, setReg] = useState("");

  const models = useMemo(
    () => (catalog.data?.models ?? []).filter((m) => m.makeId === makeId),
    [catalog.data, makeId],
  );
  const selectedModel = models.find((m) => m.id === modelId);

  const create = useMutation({
    mutationFn: () =>
      createCarFn({
        data: { makeId, modelId, registrationNumber: reg },
      }),
    onSuccess: () => {
      toast.success("Automašīna pievienota");
      setReg("");
      void qc.invalidateQueries({ queryKey: ["cars"] });
    },
    onError: (err) => toast.error(messageForError(err)),
  });

  const remove = useMutation({
    mutationFn: (carId: string) => deleteCarFn({ data: { carId } }),
    onSuccess: () => {
      toast.success("Automašīna noņemta");
      void qc.invalidateQueries({ queryKey: ["cars"] });
    },
    onError: (err) => toast.error(messageForError(err)),
  });

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-steel">Garāža</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">Manas automašīnas</h1>
        <p className="mt-2 max-w-md text-sm text-muted">
          Kategoriju un cenu nosaka katalogs, nevis pārlūks.
        </p>
        <div className="mt-6 space-y-3">
          {(cars.data ?? []).length === 0 && !cars.isPending ? (
            <Card className="rounded-xl text-sm text-muted">
              Pagaidām nav automašīnu. Pievieno pirmo, lai rezervētu laiku.
            </Card>
          ) : null}
          {(cars.data ?? []).map((car) => (
            <Card key={car.id} className="flex items-start justify-between gap-4 rounded-xl">
              <div>
                <p className="font-medium">
                  {car.makeName} {car.modelName}
                </p>
                <p className="mt-1 font-mono text-sm tracking-wide text-steel">
                  {car.registrationNumber}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone="steel">
                    {CATEGORY_LABELS_LV[car.category as CarCategory] ?? car.category}
                  </Badge>
                  <Badge>
                    {formatEuro(getPriceCents(car.category))}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => remove.mutate(car.id)}
              >
                Dzēst
              </Button>
            </Card>
          ))}
        </div>
      </div>

      <Card className="h-fit rounded-xl">
        <h2 className="font-display text-xl font-semibold">Pievienot auto</h2>
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="make">Marka</Label>
            <select
              id="make"
              className="h-11 w-full rounded-md border border-border bg-bg-elevated px-3 text-sm"
              value={makeId}
              onChange={(e) => {
                setMakeId(e.target.value);
                setModelId("");
              }}
              required
            >
              <option value="">Izvēlies marku</option>
              {(catalog.data?.makes ?? []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="model">Modelis</Label>
            <select
              id="model"
              className="h-11 w-full rounded-md border border-border bg-bg-elevated px-3 text-sm"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              required
              disabled={!makeId}
            >
              <option value="">Izvēlies modeli</option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          {selectedModel ? (
            <p className="text-sm text-muted">
              Kategorija: {CATEGORY_LABELS_LV[selectedModel.category as CarCategory]} ·{" "}
              {formatEuro(getPriceCents(selectedModel.category))}
            </p>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor="reg">Reģistrācijas nr.</Label>
            <Input
              id="reg"
              value={reg}
              onChange={(e) => setReg(e.target.value.toUpperCase())}
              placeholder="AB1234"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={create.isPending}>
            Saglabāt
          </Button>
        </form>
        <Button asChild variant="ghost" className="mt-3 w-full">
          <Link to="/booking">Tālāk uz rezervāciju</Link>
        </Button>
      </Card>
    </div>
  );
}
