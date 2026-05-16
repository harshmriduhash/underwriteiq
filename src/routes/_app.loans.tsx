import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { StatusBadge } from "./_app.dashboard";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_app/loans")({
  head: () => ({ meta: [{ title: "Loans — UnderwriteIQ" }] }),
  component: LoansList,
});

function LoansList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: loans = [], isLoading } = useQuery({
    queryKey: ["loans-all", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("loans").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight">All loans</h1>
      <p className="text-sm text-muted-foreground mt-1">{loans.length} files in your pipeline.</p>

      <div className="mt-6 rounded-xl border border-border bg-surface-1 overflow-hidden">
        {isLoading ? <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div> : loans.length === 0 ? (
          <div className="p-14 text-center text-muted-foreground">No loans. Create one from the Dashboard.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-2/60 text-xs font-mono uppercase tracking-wider text-muted-foreground">
              <tr><th className="text-left p-3">Borrower</th><th className="text-left p-3">Product</th><th className="text-left p-3">Property</th><th className="text-right p-3">Amount</th><th className="text-left p-3">Status</th><th className="text-left p-3">Recommendation</th><th></th></tr>
            </thead>
            <tbody>
              {loans.map(l => (
                <tr key={l.id} className="border-t border-border hover:bg-surface-2/40 cursor-pointer" onClick={() => navigate({ to: "/loans/$loanId", params: { loanId: l.id } })}>
                  <td className="p-3 font-medium">{l.borrower_name}</td>
                  <td className="p-3 text-muted-foreground">{l.loan_product}</td>
                  <td className="p-3 text-muted-foreground truncate max-w-xs">{l.property_address || "—"}</td>
                  <td className="p-3 text-right font-mono">${Number(l.loan_amount || 0).toLocaleString()}</td>
                  <td className="p-3"><StatusBadge s={l.status} /></td>
                  <td className="p-3 text-muted-foreground">{l.recommendation || "—"}</td>
                  <td className="p-3 text-right text-muted-foreground"><ArrowRight className="h-4 w-4 inline" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
