import { createFileRoute, Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, FolderOpen, Settings, LogOut } from "lucide-react";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground text-sm">Loading workspace…</div>;
  }

  const nav = [
    { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { to: "/loans", label: "Loans", Icon: FolderOpen },
    { to: "/settings", label: "Settings", Icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className="w-60 border-r border-border bg-surface-1/40 flex flex-col">
        <div className="p-5 border-b border-border"><Logo /></div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({ to, label, Icon }) => {
            const active = loc.pathname === to || (to !== "/dashboard" && loc.pathname.startsWith(to));
            return (
              <Link key={to} to={to} className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${active ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-surface-2"}`}>
                <Icon className="h-4 w-4" /> {label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <div className="px-3 py-2 text-xs text-muted-foreground font-mono truncate">{user.email}</div>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 min-w-0"><Outlet /></main>
    </div>
  );
}
