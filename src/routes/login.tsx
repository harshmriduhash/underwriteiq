import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — UnderwriteIQ" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (user && !loading) navigate({ to: "/dashboard" }); }, [user, loading, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    navigate({ to: "/dashboard" });
  }

  return <AuthShell title="Sign in to UnderwriteIQ" sub="Resume your underwriting workflow.">
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5"><Label htmlFor="e">Work email</Label>
        <Input id="e" type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" /></div>
      <div className="space-y-1.5"><Label htmlFor="p">Password</Label>
        <Input id="p" type="password" required value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" /></div>
      <Button type="submit" className="w-full" disabled={submitting}>{submitting ? "Signing in…" : "Sign in"}</Button>
      <p className="text-sm text-center text-muted-foreground">No account? <Link to="/signup" className="text-primary hover:underline">Create one</Link></p>
    </form>
  </AuthShell>;
}

export function AuthShell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex relative overflow-hidden border-r border-border bg-surface-1">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="absolute inset-0" style={{ background: "var(--gradient-radial)" }} />
        <div className="relative p-12 flex flex-col justify-between w-full">
          <Logo size="lg" />
          <div>
            <h2 className="text-3xl font-semibold tracking-tight max-w-md">
              "We cut our Non-QM underwriting cycle from 11 days to 36 hours."
            </h2>
            <div className="mt-5 text-sm text-muted-foreground font-mono">— Director of Credit, Top-25 Non-QM lender</div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8"><Logo /></div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1.5 mb-8">{sub}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
