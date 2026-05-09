import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import AuthBackground from "@/components/auth/AuthBackground";
import AuthCard from "@/components/auth/AuthCard";
import AuthInput from "@/components/auth/AuthInput";
import GoogleButton from "@/components/auth/GoogleButton";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // Navigate once the auth state actually confirms the user is logged in
  useEffect(() => {
    if (user) navigate("/discover", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
    }
    // Navigation is handled by the useEffect above once auth state updates
  };

  const handleGoogle = async () => {
    console.log("[SignIn] Starting Google OAuth, redirectTo:", window.location.origin + "/auth/callback");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/auth/callback" },
    });
    if (error) {
      console.error("[SignIn] Google OAuth error:", error.message);
      toast({ title: "Google sign in failed", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center font-sans">
      <AuthBackground />
      <motion.div
        className="relative z-10 w-full px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <AuthCard>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Logo */}
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="4" />
                  <line x1="12" y1="2" x2="12" y2="8" />
                  <line x1="12" y1="16" x2="12" y2="22" />
                  <line x1="2" y1="12" x2="8" y2="12" />
                  <line x1="16" y1="12" x2="22" y2="12" />
                </svg>
              </div>
              <span className="text-white/80 font-semibold text-sm tracking-wide">IdeaRadar</span>
            </div>

            {/* Header */}
            <div className="text-center space-y-1">
              <h1 className="text-xl font-bold bg-gradient-to-b from-white to-white/80 bg-clip-text text-transparent">Welcome Back</h1>
              <p className="text-xs text-white/60">Sign in to continue discovering ideas</p>
            </div>

            {/* Inputs */}
            <div className="space-y-3">
              <AuthInput icon={Mail} type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <AuthInput icon={Lock} isPassword placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            {/* Remember / Forgot */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-white/60 cursor-pointer">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 accent-[hsl(153,48%,19%)]" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-white/60 hover:text-white transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              className="relative w-full bg-white text-black font-semibold rounded-lg py-2.5 text-sm flex items-center justify-center gap-2 overflow-hidden disabled:opacity-70"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {loading && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
              </span>
            </motion.button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/5" />
              <motion.span className="text-xs text-white/40" animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 3, repeat: Infinity }}>or</motion.span>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            {/* Google */}
            <GoogleButton label="Sign in with Google" onClick={handleGoogle} disabled={loading} />

            {/* Footer */}
            <p className="text-center text-xs text-white/50">
              Don't have an account?{" "}
              <Link to="/signup" className="text-white/80 hover:text-white underline-offset-4 hover:underline transition-colors">
                Sign up
              </Link>
            </p>
          </form>
        </AuthCard>
      </motion.div>
    </div>
  );
};

export default SignIn;
