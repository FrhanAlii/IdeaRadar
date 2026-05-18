import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, CalendarDays, Settings, LogOut, ChevronLeft,
  Compass, Bookmark, TrendingUp, RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useUserSubscription } from "@/hooks/useSupabaseData";

const menuItems = [
  { label: "Discover",   icon: Compass,          path: "/discover", hasBadge: true },
  { label: "Saved",      icon: Bookmark,         path: "/saved" },
  { label: "Trends",     icon: TrendingUp,       path: "/trends" },
  { label: "Crawl Jobs", icon: RefreshCw,        path: "/crawl-jobs" },
  { label: "Dashboard",  icon: LayoutDashboard,  path: "/dashboard" },
];

const generalItems = [
  { label: "Settings", icon: Settings, path: "/settings" },
];

const TIER_CONFIG: Record<string, { label: string; cls: string }> = {
  free:     { label: "Free Plan", cls: "bg-secondary text-muted" },
  pro:      { label: "Pro Plan",  cls: "bg-blue-100 text-blue-700" },
  pro_plus: { label: "Pro Plus",  cls: "bg-purple-100 text-purple-700" },
  admin:    { label: "Admin",     cls: "bg-green-100 text-green-700" },
};

export function AppSidebar({
  collapsed,
  onToggle,
  mobileOpen = false,
  onMobileClose,
}: {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname === path;

  const { user } = useAuth();
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single()
      .then(({ data }) => setProfile(data));
  }, [user?.id]);

  const { data: subscription } = useUserSubscription(user?.id ?? "");
  const tier = (subscription?.tier ?? 'free') as string;
  const displayName = profile?.full_name || user?.email || "User";
  const initials = displayName.charAt(0).toUpperCase();
  const { label: tierLabel, cls: tierCls } = TIER_CONFIG[tier] ?? TIER_CONFIG.free;
  const showUpgrade = tier === 'free' || tier === 'pro';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Signed out" });
    navigate("/signin");
  };

  const handleNavClick = () => {
    if (onMobileClose) onMobileClose();
  };

  const effectiveCollapsed = mobileOpen ? false : collapsed;

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen bg-card border-r border-border flex flex-col z-40 transition-all duration-200
          ${mobileOpen ? "flex" : "hidden"} lg:flex
          ${mobileOpen ? "w-4/5 max-w-[300px]" : effectiveCollapsed ? "w-[68px]" : "w-[220px]"}`}
      >
        <div className="flex items-center gap-3 px-5 py-5">
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
          {!effectiveCollapsed && <span className="text-lg font-bold text-primary">IdeaRadar</span>}
        </div>
        <nav className="flex-1 px-3 overflow-y-auto">
          {!effectiveCollapsed && <p className="text-[11px] font-semibold text-muted uppercase tracking-[0.05em] px-3 mb-2">Menu</p>}
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link to={item.path}
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative ${
                    isActive(item.path)
                      ? "bg-primary/10 text-primary font-semibold before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-6 before:rounded-full before:bg-primary"
                      : "text-foreground/70 hover:bg-secondary hover:text-foreground"
                  }`}>
                  <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                  {!effectiveCollapsed && <span>{item.label}</span>}
                  {item.hasBadge && 0 > 0 && !effectiveCollapsed && (
                    <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">{0}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6">
            {!effectiveCollapsed && <p className="text-[11px] font-semibold text-muted uppercase tracking-[0.05em] px-3 mb-2">General</p>}
            <ul className="space-y-1">
              {generalItems.map((item) => (
                <li key={item.path}>
                  <Link to={item.path}
                    onClick={handleNavClick}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                      isActive(item.path) ? "bg-primary/10 text-primary font-semibold" : "text-foreground/70 hover:bg-secondary hover:text-foreground"
                    }`}>
                    <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                    {!effectiveCollapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              ))}
              <li>
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground/70 hover:bg-secondary hover:text-foreground transition-all duration-150">
                  <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
                  {!effectiveCollapsed && <span>Logout</span>}
                </button>
              </li>
            </ul>
          </div>
        </nav>

        <div className="border-t border-border px-3 py-3 flex-shrink-0">
          <div className={`flex flex-row items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-secondary transition-colors ${effectiveCollapsed ? "justify-center" : ""}`}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="avatar" className="w-8 h-8 rounded-full flex-shrink-0 object-cover self-center" />
            ) : (
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0 self-center">
                <span className="text-white text-xs font-medium">{initials}</span>
              </div>
            )}
            {!effectiveCollapsed && (
              <>
                <div className="flex flex-col justify-center flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate leading-none">{displayName}</p>
                  <span className={`mt-1 self-start text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${tierCls}`}>{tierLabel}</span>
                </div>
                {showUpgrade && (
                  <button
                    onClick={() => navigate('/settings')}
                    className="flex-shrink-0 self-center gradient-primary text-primary-foreground text-[11px] font-semibold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
                  >
                    Upgrade
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Desktop-only collapse toggle */}
        <button onClick={onToggle}
          className="hidden lg:flex absolute -right-3 top-8 w-6 h-6 bg-card border border-border rounded-full items-center justify-center shadow-card hover:bg-secondary transition-colors">
          <ChevronLeft className={`w-3.5 h-3.5 text-muted transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </aside>
    </>
  );
}
