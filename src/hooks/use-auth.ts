import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AuthState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
};

/**
 * Client-side auth state. Registers the listener before the initial read so
 * no transition is missed. Server trust always comes from the bearer token
 * validated inside server functions, never from this hook.
 */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    loading: true,
    session: null,
    user: null,
  });

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ loading: false, session, user: session?.user ?? null });
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({ loading: false, session, user: session?.user ?? null });
    });

    return () => data.subscription.unsubscribe();
  }, []);

  return state;
}
