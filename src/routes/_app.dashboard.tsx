import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, ArrowRight, Activity, FileCheck2, Clock4, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — UnderwriteIQ" }] }),
  component: Dashboard,
});

const PRODUCTS = ["DSCR", "Bank Statement", "Jumbo", "Fix & Flip", "Foreign National", "Asset Depletion"];

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: loans = [], isLoading } = useQuery({
    queryKey: ["loans", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("loans").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async (input: { borrower_name: string; loan_product: string; property_address: string; loan_amount: number; property_value: number }) => {
      const { data, error } = await supabase.from("loans").insert({ ...input, user_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (loan) => {
      qc.invalidateQueries({ queryKey: ["loans"] });
      setOpen(false);
      toast.success("Loan created");
      navigate({ to: "/loans/$loanId", params: { loanId: loan.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const stats = {
    total: loans.length,
    inFlight: loans.filter(l => !["decisioned", "closed"].includes(l.status)).length,
    decisioned: loans.filter(l => l.status === "decisioned").length,
    volume: loans.reduce((a, l) => a + (Number(l.loan_amount) || 0), 0),
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Your Non-QM underwriting pipeline.</p>
        </div>
        <NewLoanDialog open={open} onOpenChange={setOpen} onCreate={(d) => create.mutate(d)} pending={create.isPending} />
      </div>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total loans" value={stats.total.toString()} Icon={Activity} />
        <Stat label="In review" value={stats.inFlight.toString()} Icon={Clock4} />
        <Stat label="Decisioned" value={stats.decisioned.toString()} Icon={FileCheck2} />
        <Stat label="Total volume" value={`$${(stats.volume/1_000_000).toFixed(2)}M`} Icon={TrendingUp} />
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground">Recent loans</h2>
          <Link to="/loans" className="text-sm text-primary hover:underline">View all →</Link>
        </div>
        <div className="rounded-xl border border-border bg-surface-1 overflow-hidden">
          {isLoading ? (
            <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>
          ) : loans.length === 0 ? (
            <div className="p-14 text-center">
              <p className="text-muted-foreground">No loans yet.</p>
              <Button className="mt-4" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1.5" />Create your first loan</Button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-surface-2/60 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                <tr><th className="text-left p-3">Borrower</th><th className="text-left p-3">Product</th><th className="text-left p-3">Property</th><th className="text-right p-3">Amount</th><th className="text-left p-3">Status</th><th></th></tr>
              </thead>
              <tbody>
                {loans.slice(0, 8).map(l => (
                  <tr key={l.id} className="border-t border-border hover:bg-surface-2/40 cursor-pointer" onClick={() => navigate({ to: "/loans/$loanId", params: { loanId: l.id } })}>
                    <td className="p-3 font-medium">{l.borrower_name}</td>
                    <td className="p-3 text-muted-foreground">{l.loan_product}</td>
                    <td className="p-3 text-muted-foreground truncate max-w-xs">{l.property_address || "—"}</td>
                    <td className="p-3 text-right font-mono">${Number(l.loan_amount || 0).toLocaleString()}</td>
                    <td className="p-3"><StatusBadge s={l.status} /></td>
                    <td className="p-3 text-right text-muted-foreground"><ArrowRight className="h-4 w-4 inline" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, Icon }: { label: string; value: string; Icon: React.ComponentType<{className?: string}> }) {
  return (
    <div className="rounded-xl border border-border bg-surface-1 p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">{label}</span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-3 text-2xl font-semibold font-mono">{value}</div>
    </div>
  );
}

export function StatusBadge({ s }: { s: string }) {
  const m: Record<string, string> = {
    intake: "bg-muted text-muted-foreground",
    processing: "bg-warning/15 text-warning",
    review: "bg-primary/15 text-primary",
    decisioned: "bg-success/15 text-success",
    closed: "bg-success/15 text-success",
  };
  return <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-mono ${m[s] ?? "bg-muted text-muted-foreground"}`}>{s}</span>;
}

function NewLoanDialog({ open, onOpenChange, onCreate, pending }: { open: boolean; onOpenChange: (v: boolean) => void; onCreate: (d: { borrower_name: string; loan_product: string; property_address: string; loan_amount: number; property_value: number }) => void; pending: boolean }) {
  const [form, setForm] = useState({ borrower_name: "", loan_product: "DSCR", property_address: "", loan_amount: "", property_value: "" });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1.5" />New loan</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create a new loan file</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); onCreate({ ...form, loan_amount: Number(form.loan_amount) || 0, property_value: Number(form.property_value) || 0 }); }} className="space-y-4">
          <div className="space-y-1.5"><Label>Borrower name</Label>
            <Input required value={form.borrower_name} onChange={e => setForm({ ...form, borrower_name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Loan product</Label>
            <Select value={form.loan_product} onValueChange={(v) => setForm({ ...form, loan_product: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PRODUCTS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select></div>
          <div className="space-y-1.5"><Label>Property address</Label>
            <Input value={form.property_address} onChange={e => setForm({ ...form, property_address: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Loan amount ($)</Label>
              <Input type="number" value={form.loan_amount} onChange={e => setForm({ ...form, loan_amount: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Property value ($)</Label>
              <Input type="number" value={form.property_value} onChange={e => setForm({ ...form, property_value: e.target.value })} /></div>
          </div>
          <DialogFooter><Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create loan"}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
