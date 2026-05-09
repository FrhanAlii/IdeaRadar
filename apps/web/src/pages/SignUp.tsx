import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AuthBackground from "@/components/auth/AuthBackground";
import AuthCard from "@/components/auth/AuthCard";
import AuthInput from "@/components/auth/AuthInput";
import GoogleButton from "@/components/auth/GoogleButton";

const getStrength = (pw: string): { label: string; pct: number; color: string } => {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: "Weak", pct: 25, color: "hsl(355,78%,56%)" };
  if (score <= 3) return { label: "Fair", pct: 55, color: "hsl(45,93%,58%)" };
  return { label: "Strong", pct: 100, color: "hsl(153,30%,48%)" };
};

const SignUp = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const strength = useMemo(() => getStrength(password), [password]);
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !confirmPassword) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (!agree) {
      toast({ title: "Please agree to the Terms of Service", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Account created!", description: "Check your email to confirm your account." });
      navigate("/signin");
    }
  };

  const handleGoogle = async () => {
    console.log("[SignUp] Starting Google OAuth, redirectTo:", window.location.origin + "/auth/callback");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/auth/callback" },
    });
    if (error) {
      console.error("[SignUp] Google OAuth error:", error.message);
      toast({ title: "Google sign up failed", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center font-sans">
      <AuthBackground />
      <motion.div className="relative z-10 w-full px-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <AuthCard>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Logo */}
            <div className="flex items-center justify-center gap-2 mb-1">
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

            <div className="text-center space-y-1">
              <h1 className="text-xl font-bold bg-gradient-to-b from-white to-white/80 bg-clip-text text-transparent">Create Account</h1>
              <p className="text-xs text-white/60">Start discovering your next big startup idea</p>
            </div>

            <div className="space-y-3">
              <AuthInput icon={User} type="text" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required maxLength={100} />
              <AuthInput icon={Mail} type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} />
              <div>
                <AuthInput icon={Lock} isPassword placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                {password && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                      <motion.div className="h-full rounded-full" style={{ backgroundColor: strength.color }} initial={{ width: 0 }} animate={{ width: `${strength.pct}%` }} transition={{ duration: 0.3 }} />
                    </div>
                    <span className="text-[10px]" style={{ color: strength.color }}>{strength.label}</span>
                  </div>
                )}
              </div>
              <div>
                <AuthInput icon={Lock} isPassword placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                {passwordMismatch && <p className="text-[11px] text-red-400 mt-1">Passwords do not match</p>}
              </div>
            </div>

            <label className="flex items-start gap-2 text-xs text-white/60 cursor-pointer">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 w-3.5 h-3.5 rounded border-white/20 bg-white/5 accent-[hsl(153,48%,19%)]" />
              <span>I agree to the <span className="text-white/80 underline">Terms of Service</span> and <span className="text-white/80 underline">Privacy Policy</span></span>
            </label>

            <motion.button
              type="submit"
              disabled={loading}
              className="relative w-full bg-white text-black font-semibold rounded-lg py-2.5 text-sm flex items-center justify-center gap-2 overflow-hidden disabled:opacity-70"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {loading && (
                <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent" animate={{ x: ["-100%", "100%"] }} transition={{ duration: 1, repeat: Infinity }} />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
              </span>
            </motion.button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-xs text-white/40">or</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            <GoogleButton label="Sign up with Google" onClick={handleGoogle} disabled={loading} />

            <p className="text-center text-xs text-white/50">
              Already have an account?{" "}
              <Link to="/signin" className="text-white/80 hover:text-white underline-offset-4 hover:underline transition-colors">Sign in</Link>
            </p>
          </form>
        </AuthCard>
      </motion.div>
    </div>
  );
};

export default SignUp;
