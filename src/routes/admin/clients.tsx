import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { messageForError } from "@/lib/booking/rules";
import { adminListClientsFn, adminSetBannedFn } from "@/server/functions";

export const Route = createFileRoute("/admin/clients")({ component: ClientsPage });

function ClientsPage() {
  const qc = useQueryClient();
  const [reason, setReason] = useState("Pārkāpti noteikumi");
  const clients = useQuery({ queryKey: ["admin-clients"], queryFn: () => adminListClientsFn() });
  const ban = useMutation({
    mutationFn: (input: { userId: string; banned: boolean }) =>
      adminSetBannedFn({
        data: { ...input, reason: input.banned ? reason : undefined },
      }),
    onSuccess: () => {
      toast.success("Klienta statuss atjaunināts");
      void qc.invalidateQueries({ queryKey: ["admin-clients"] });
    },
    onError: (err) => toast.error(messageForError(err)),
  });

  return (
    <div>
      <div className="mb-4 max-w-sm">
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ban iemesls"
        />
      </div>
      <div className="space-y-3">
        {(clients.data ?? []).map((c) => (
          <Card key={c.userId} className="flex flex-col gap-3 rounded-xl sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{c.name ?? "Bez vārda"}</p>
              <p className="text-sm text-muted">
                {c.email} {c.phone ? `· ${c.phone}` : ""}
              </p>
              <div className="mt-2 flex gap-2">
                <Badge tone={c.role === "admin" ? "steel" : "neutral"}>{c.role}</Badge>
                {c.banned ? <Badge tone="danger">BAN</Badge> : <Badge tone="ok">aktīvs</Badge>}
              </div>
              {c.banReason ? <p className="mt-1 text-xs text-danger">{c.banReason}</p> : null}
            </div>
            {c.role === "admin" ? null : (
              <Button
                variant={c.banned ? "secondary" : "danger"}
                onClick={() => ban.mutate({ userId: c.userId, banned: !c.banned })}
              >
                {c.banned ? "Atbloķēt" : "Bloķēt"}
              </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
