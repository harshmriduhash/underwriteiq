import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — UnderwriteIQ" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const [name, setName] = useState(profile?.full_name ?? "");
  const [company, setCompany] = useState(profile?.company ?? "");

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").upsert({ id: user!.id, full_name: name, company });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["profile"] }); toast.success("Profile saved"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <p className="text-sm text-muted-foreground mt-1">Manage your account, organization, and security preferences.</p>

      <div className="mt-8 rounded-xl border border-border bg-surface-1 p-6">
        <h2 className="font-semibold">Profile</h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="space-y-1.5"><Label>Full name</Label><Input defaultValue={profile?.full_name ?? ""} onChange={e => setName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Company</Label><Input defaultValue={profile?.company ?? ""} onChange={e => setCompany(e.target.value)} /></div>
          <div className="space-y-1.5 col-span-2"><Label>Email</Label><Input value={user?.email ?? ""} disabled /></div>
        </div>
        <Button className="mt-5" onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save changes"}</Button>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface-1 p-6">
        <h2 className="font-semibold">Compliance</h2>
        <p className="text-sm text-muted-foreground mt-2">UnderwriteIQ operates in accordance with the Equal Credit Opportunity Act (ECOA), Fair Housing Act, and Gramm-Leach-Bliley Act. All loan files are encrypted at rest with AES-256 and isolated per organization with row-level security.</p>
        <div className="mt-4 grid grid-cols-3 gap-3 text-sm font-mono">
          {["AES-256", "TLS 1.3", "RLS isolated", "Audit trail", "MISMO 3.4", "GLBA"].map(t => (
            <div key={t} className="border border-border rounded-md p-3 text-center text-muted-foreground">{t}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
