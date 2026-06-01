import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthCtx = { user: User | null; session: Session | null; loading: boolean; signOut: () => Promise<void> };
const Ctx = createContext<AuthCtx>({ user: null, session: null, loading: true, signOut: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const applySession = (s: Session | null) => {
      setSession(s); setUser(s?.user ?? null); setLoading(false);
      if (s?.user) void ensureProfile(s.user);
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      applySession(s);
    });
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      applySession(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  return <Ctx.Provider value={{ user, session, loading, signOut: async () => { await supabase.auth.signOut(); } }}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);

async function ensureProfile(user: User) {
  const metadata = user.user_metadata ?? {};
  await supabase.from("profiles").upsert({
    id: user.id,
    full_name: typeof metadata.full_name === "string" ? metadata.full_name : null,
    company: typeof metadata.company === "string" ? metadata.company : null,
  }, { onConflict: "id", ignoreDuplicates: true });
}
