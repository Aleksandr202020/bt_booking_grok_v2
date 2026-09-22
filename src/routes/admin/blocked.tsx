import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatLvDate, getRigaNowParts } from "@/lib/booking/dates";
import { WORKING_SLOTS, messageForError } from "@/lib/booking/rules";
import {
  adminCreateBlockedFn,
  adminDeleteBlockedFn,
  adminListBlockedFn,
} from "@/server/functions";

export const Route = createFileRoute("/admin/blocked")({ component: BlockedPage });

function BlockedPage() {
  const qc = useQueryClient();
  const today = getRigaNowParts().date;
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("");
  const [wholeDay, setWholeDay] = useState(false);
  const [reason, setReason] = useState("");

  const list = useQuery({ queryKey: ["admin-blocked"], queryFn: () => adminListBlockedFn() });
  const create = useMutation({
    mutationFn: () =>
      adminCreateBlockedFn({
        data: {
          bookingDate: date,
          bookingTime: wholeDay ? null : time,
          reason,
        },
      }),
    onSuccess: () => {
      toast.success("Laiks bloķēts");
      setReason("");
      void qc.invalidateQueries({ queryKey: ["admin-blocked"] });
      void qc.invalidateQueries({ queryKey: ["admin-availability"] });
    },
    onError: (err) => toast.error(messageForError(err)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => adminDeleteBlockedFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Bloks noņemts");
      void qc.invalidateQueries({ queryKey: ["admin-blocked"] });
    },
    onError: (err) => toast.error(messageForError(err)),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <Card className="h-fit rounded-xl">
        <h2 className="font-display text-xl font-semibold">Bloķēt laiku</h2>
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label>Datums</Label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 w-full rounded-md border border-border bg-bg-elevated px-3 text-sm"
              required
            />
          </div>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={wholeDay}
              onChange={(e) => setWholeDay(e.target.checked)}
            />
            Visa diena
          </label>
          {wholeDay ? null : (
            <div className="space-y-1.5">
              <Label>Stunda</Label>
              <select
                className="h-11 w-full rounded-md border border-border bg-bg-elevated px-3 text-sm"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              >
                <option value="">Izvēlies</option>
                {WORKING_SLOTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Iemesls</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={create.isPending}>
            Bloķēt
          </Button>
        </form>
      </Card>
      <div className="space-y-3">
        {(list.data ?? []).map((row) => (
          <Card key={row.id} className="flex items-start justify-between gap-3 rounded-xl">
            <div>
              <p className="font-medium">
                {formatLvDate(row.bookingDate)} · {row.bookingTime ?? "visa diena"}
              </p>
              <p className="mt-1 text-sm text-muted">{row.reason}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => remove.mutate(row.id)}>
              Noņemt
            </Button>
          </Card>
        ))}
        {(list.data ?? []).length === 0 ? (
          <p className="text-sm text-muted">Nav bloķētu laiku.</p>
        ) : null}
      </div>
    </div>
  );
}
