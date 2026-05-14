import { Search, X, Bell, CheckCircle, XCircle, Loader2, Menu } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useUserSubscription } from "@/hooks/useSupabaseData";

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function friendlyError(raw: string | null): string {
  if (!raw) return "An unexpected error occurred. Please try again.";
  const msg = raw.toLowerCase();
  if (msg.includes("charmap") || msg.includes("codec") || msg.includes("encode") || msg.includes("unicode"))
    return "A text encoding issue was encountered while processing posts.";
  if (msg.includes("errno 22") || msg.includes("invalid argument"))
    return "A file system error occurred. Check that all paths and configs are valid.";
  if (msg.includes("openai") && (msg.includes("quota") || msg.includes("limit") || msg.includes("rate")))
    return "OpenAI API rate limit reached. The crawl will retry automatically next time.";
  if (msg.includes("openai") || msg.includes("api key") || msg.includes("authentication"))
    return "AI scoring service is unavailable. Check your OpenAI API key.";
  if (msg.includes("timeout") || msg.includes("timed out"))
    return "The crawl timed out. This may be a temporary network issue.";
  if (msg.includes("connection") || msg.includes("network") || msg.includes("errno 11001") || msg.includes("getaddrinfo"))
    return "Network connection failed. Check your internet connection and try again.";
  if (msg.includes("supabase") || msg.includes("postgres") || msg.includes("relation") || msg.includes("table"))
    return "Database error occurred. The schema may need to be updated.";
  if (msg.includes("reddit") || msg.includes("praw"))
    return "Reddit fetch failed. The API credentials may be invalid or rate-limited.";
  if (msg.includes("orphaned"))
    return "A previous crawl job was left running and has been cleaned up.";
  return "The crawl encountered an unexpected error. Please try again.";
}

export function TopBar({ onMobileMenuToggle }: { onMobileMenuToggle?: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [query, setQuery] = useState(searchParams.get("q") || "");

  const { data: subscription } = useUserSubscription(user?.id ?? "");
  const isAdmin = subscription?.tier === 'admin';

  // Notifications
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  const getLastSeen = () => localStorage.getItem(`notif_last_seen_${user?.id}`) || "";

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    if (isAdmin) {
      const { data } = await (supabase.from("crawl_jobs") as any)
        .select("id, status, started_at, finished_at, ideas_new, ideas_updated, posts_scanned, error_message")
        .in("status", ["done", "failed", "running"])
        .order("started_at", { ascending: false })
        .limit(10);
      if (data) {
        setNotifications(data);
        const lastSeen = getLastSeen();
        const unread = data.filter(
          (j: any) => j.finished_at && (!lastSeen || j.finished_at > lastSeen)
        ).length;
        setUnreadCount(unread);
      }
    } else {
      const { data } = await supabase
        .from("viewed_ideas")
        .select("idea_id, viewed_at")
        .eq("user_id", user.id)
        .order("viewed_at", { ascending: false })
        .limit(200);

      if (!data || data.length === 0) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      const sessions: any[] = [];
      let current = { id: data[0].viewed_at, started_at: data[0].viewed_at, ideas_found: 1, status: "done" };
      for (let i = 1; i < data.length; i++) {
        const gap = new Date(current.started_at).getTime() - new Date(data[i].viewed_at).getTime();
        if (gap < 60000) {
          current.ideas_found++;
        } else {
          sessions.push({ ...current });
          current = { id: data[i].viewed_at, started_at: data[i].viewed_at, ideas_found: 1, status: "done" };
        }
      }
      sessions.push({ ...current });

      const sliced = sessions.slice(0, 10);
      setNotifications(sliced);
      const lastSeen = getLastSeen();
      setUnreadCount(sliced.filter(s => !lastSeen || s.started_at > lastSeen).length);
    }
  }, [isAdmin, user]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Real-time: refresh list and push browser notification on crawl update
  useEffect(() => {
    if (isAdmin) {
      const channel = supabase
        .channel("crawl-job-topbar")
        .on(
          "postgres_changes" as any,
          { event: "UPDATE", schema: "public", table: "crawl_jobs" },
          (payload: any) => {
            fetchNotifications();
            const job = payload.new;
            if (Notification.permission === "granted" && localStorage.getItem("notif_push") !== "false") {
              if (job.status === "done") {
                new Notification("IdeaRadar — Crawl Complete", {
                  body: `${job.ideas_new} new ideas found, ${job.ideas_updated} updated · ${job.posts_scanned} posts scanned`,
                  icon: "/logo.svg",
                });
              } else if (job.status === "failed") {
                new Notification("IdeaRadar — Crawl Failed", {
                  body: friendlyError(job.error_message),
                  icon: "/logo.svg",
                });
              }
            }
          }
        )
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    } else {
      if (!user?.id) return;
      const channel = supabase
        .channel("viewed-ideas-topbar")
        .on(
          "postgres_changes" as any,
          { event: "INSERT", schema: "public", table: "viewed_ideas", filter: `user_id=eq.${user.id}` },
          () => { fetchNotifications(); }
        )
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [fetchNotifications, isAdmin, user?.id]);

  const openNotifications = () => {
    setShowNotif((v) => !v);
    if (!showNotif) {
      localStorage.setItem(`notif_last_seen_${user?.id}`, new Date().toISOString());
      setUnreadCount(0);
    }
  };

  // Search
  useEffect(() => {
    setQuery(location.pathname === "/discover" ? (searchParams.get("q") || "") : "");
  }, [location.pathname, searchParams]);

  const handleSearch = (val: string) => {
    setQuery(val);
    if (val.trim()) {
      navigate(`/discover?q=${encodeURIComponent(val.trim())}`, { replace: true });
    } else {
      navigate("/discover", { replace: true });
    }
  };

  const clearSearch = () => {
    setQuery("");
    navigate("/discover", { replace: true });
  };

  // Profile
  const fetchProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await (supabase.from("profiles") as any)
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single();
    setDisplayName(data?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "");
    setAvatarUrl(data?.avatar_url || null);
  }, [user]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  useEffect(() => {
    window.addEventListener("profile-updated", fetchProfile);
    return () => window.removeEventListener("profile-updated", fetchProfile);
  }, [fetchProfile]);

  const initials = displayName
    ? displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : (user?.email?.[0] || "U").toUpperCase();

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 lg:px-6">
      {/* Left: hamburger (mobile) + search (sm+) */}
      <div className="flex items-center gap-2">
        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-2 rounded-xl hover:bg-secondary transition-colors"
          onClick={onMobileMenuToggle}
        >
          <Menu className="w-5 h-5 text-muted" />
        </button>

        {/* Search — hidden on mobile, visible on sm+ */}
        <div className="relative hidden sm:flex">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search ideas..."
          className="bg-secondary pl-10 pr-8 py-2.5 rounded-xl text-sm text-foreground placeholder:text-muted border-none outline-none focus:ring-2 focus:ring-primary/20 w-64 transition-all"
        />
        {query && (
          <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        {/* Bell + dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={openNotifications}
            className="relative p-2 rounded-xl hover:bg-secondary transition-colors"
          >
            <Bell className="w-5 h-5 text-muted" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-destructive rounded-full text-[10px] text-white font-bold flex items-center justify-center px-0.5">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-12 w-[calc(100vw-1rem)] sm:w-80 bg-card border border-border rounded-2xl shadow-lg z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-sm font-semibold text-foreground">Crawl Notifications</span>
                <button onClick={() => setShowNotif(false)} className="text-muted hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-muted">No notifications yet</div>
                ) : isAdmin ? (
                  notifications.map((job) => {
                    const isDone = job.status === "done";
                    const isFailed = job.status === "failed";
                    const isRunning = job.status === "running";
                    const lastSeen = getLastSeen();
                    const isUnread = job.finished_at && (!lastSeen || job.finished_at > lastSeen);

                    return (
                      <div
                        key={job.id}
                        className={`flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 ${isUnread ? "bg-primary/5" : ""}`}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          {isDone && <CheckCircle className="w-4 h-4 text-green-500" />}
                          {isFailed && <XCircle className="w-4 h-4 text-destructive" />}
                          {isRunning && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {isDone && "Crawl Complete"}
                            {isFailed && "Crawl Failed"}
                            {isRunning && "Crawl Running"}
                          </p>
                          <p className="text-xs text-muted mt-0.5 leading-relaxed">
                            {isDone && `${job.ideas_new} new ideas · ${job.ideas_updated} updated · ${job.posts_scanned} posts scanned`}
                            {isFailed && friendlyError(job.error_message)}
                            {isRunning && "Processing posts..."}
                          </p>
                          <p className="text-[11px] text-muted/60 mt-1">
                            {timeAgo(job.finished_at || job.started_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  notifications.map((session) => {
                    const lastSeen = getLastSeen();
                    const isUnread = !lastSeen || session.started_at > lastSeen;
                    return (
                      <div
                        key={session.id}
                        className={`flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 ${isUnread ? "bg-primary/5" : ""}`}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">Ideas Discovered</p>
                          <p className="text-xs text-muted mt-0.5 leading-relaxed">
                            {session.ideas_found} new idea{session.ideas_found !== 1 ? "s" : ""} found
                          </p>
                          <p className="text-[11px] text-muted/60 mt-1">
                            {timeAgo(session.started_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="flex items-center gap-3 ml-2">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              {initials}
            </div>
          )}
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-foreground leading-tight">
              {displayName || user?.email?.split("@")[0]}
            </p>
            <p className="text-[11px] text-muted">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
