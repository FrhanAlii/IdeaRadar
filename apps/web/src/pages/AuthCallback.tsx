import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    console.log("[AuthCallback] Mounted — processing OAuth callback");
    let unsubscribe: (() => void) | null = null;

    const timeout = setTimeout(() => {
      console.warn("[AuthCallback] Timeout — no session after 10 s, redirecting to /signin");
      unsubscribe?.();
      navigate("/signin", { replace: true });
    }, 10000);

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) console.error("[AuthCallback] getSession error:", error.message);

      if (session) {
        console.log("[AuthCallback] Session ready immediately:", session.user.email);
        clearTimeout(timeout);
        navigate("/discover", { replace: true });
        return;
      }

      console.log("[AuthCallback] No immediate session — waiting for SIGNED_IN event");
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        console.log("[AuthCallback] Auth event:", event, session?.user?.email ?? "no user");
        if (event === "SIGNED_IN" && session) {
          clearTimeout(timeout);
          data.subscription.unsubscribe();
          navigate("/discover", { replace: true });
        }
      });
      unsubscribe = () => data.subscription.unsubscribe();
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe?.();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Completing sign in…</p>
    </div>
  );
}
