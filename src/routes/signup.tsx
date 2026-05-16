import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "./login";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Get started — UnderwriteIQ" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (user && !loading) navigate({ to: "/dashboard" }); }, [user, loading, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const redirectTo = typeof window !== "undefined" ? window.location.origin : undefined;
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName, company }, emailRedirectTo: redirectTo },
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Account created — check your email to confirm.");
    navigate({ to: "/dashboard" });
  }

  return <AuthShell title="Create your account" sub="Process your first Non-QM loan in minutes.">
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label htmlFor="n">Full name</Label>
          <Input id="n" required value={fullName} onChange={e => setFullName(e.target.value)} /></div>
        <div className="space-y-1.5"><Label htmlFor="c">Company</Label>
          <Input id="c" required value={company} onChange={e => setCompany(e.target.value)} /></div>
      </div>
      <div className="space-y-1.5"><Label htmlFor="e">Work email</Label>
        <Input id="e" type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" /></div>
      <div className="space-y-1.5"><Label htmlFor="p">Password</Label>
        <Input id="p" type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" /></div>
      <Button type="submit" className="w-full" disabled={submitting}>{submitting ? "Creating…" : "Create account"}</Button>
      <p className="text-sm text-center text-muted-foreground">Already have one? <Link to="/login" className="text-primary hover:underline">Sign in</Link></p>
    </form>
  </AuthShell>;
}
