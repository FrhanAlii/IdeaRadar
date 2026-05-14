import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Compass, RefreshCw, Settings, Lock, Bookmark } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useIdeas, useViewedIdeas, useUserSubscription, useUserCrawlsToday, useSavedIdeas } from "@/hooks/useSupabaseData";
import { IdeaCard } from "@/components/ideas/IdeaCard";
import { useReadIdeas } from "@/hooks/useReadIdeas";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const PROGRESS_STEPS = [
  { label: "Searching Reddit...",         duration: 800 },
  { label: "Searching Hacker News...",    duration: 1100 },
  { label: "Grading posts...",            duration: 1400 },
  { label: "Clustering similar ideas...", duration: 900 },
  { label: "Finalizing...",               duration: 600 },
];

interface LimitModalProps {
  open: boolean;
  onClose: () => void;
  tier: string;
  nextResetAt: string | null;
}

const LimitReachedModal = ({ open, onClose, tier, nextResetAt }: LimitModalProps) => {
  if (!open) return null;

  const resetTime = nextResetAt
    ? new Date(nextResetAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'midnight';

  const limits: Record<string, { current: number; next: string; nextLabel: string }> = {
    free:     { current: 2,   next: 'pro',      nextLabel: 'Pro — 5 crawls/day for $15/mo' },
    pro:      { current: 5,   next: 'pro_plus', nextLabel: 'Pro Plus — Unlimited for $29/mo' },
    pro_plus: { current: 999, next: '',          nextLabel: '' },
  };

  const info = limits[tier] || limits['free'];

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl max-w-md w-full p-6 shadow-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
            <span className="text-2xl">⏱️</span>
          </div>
        </div>
        <h2 className="text-lg font-semibold text-center text-foreground mb-2">
          Daily limit reached
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          You have used all {info.current} crawls for today on your{' '}
          <span className="font-medium capitalize">{tier}</span> plan.
          Your limit resets at <span className="font-medium">{resetTime}</span>.
        </p>
        <div className="flex flex-col gap-3">
          {info.next && (
            <button
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
              onClick={() => { onClose(); window.location.href = '/settings'; }}
            >
              Upgrade — {info.nextLabel}
            </button>
          )}
          <button
            className="w-full py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-secondary transition"
            onClick={onClose}
          >
            Wait until {resetTime}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const BookmarkLimitModal = ({
  open,
  onClose,
  onGoToSaved,
}: {
  open: boolean;
  onClose: () => void;
  onGoToSaved: () => void;
}) => {
  if (!open) return null;
  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl max-w-md w-full p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
            <Bookmark className="w-6 h-6 text-amber-600" />
          </div>
        </div>
        <h2 className="text-lg font-semibold text-center text-foreground mb-2">
          Bookmark limit reached
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          You've saved 5 ideas — the free plan limit.<br />
          Unsave an idea to make room for this one.
        </p>
        <div className="flex flex-col gap-3">
          <button
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
            onClick={onGoToSaved}
          >
            Go to Saved Ideas →
          </button>
          <button
            className="w-full py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-secondary transition"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const LOCKED_IDEA_TEMPLATE = {
  id: "__locked__",
  title: "AI-Powered Productivity Tool for Remote Teams",
  summary: "Strong demand signals detected across multiple platforms. Users are actively looking for a solution in this space with high willingness to pay.",
  grade: "A" as const,
  score_demand: 87,
  score_mobile_fit: 74,
  score_monetization: 81,
  score_buildability: 68,
  score_competition: 52,
  source_count: 4,
  unique_users: 3,
  total_upvotes: 1243,
  total_comments: 187,
  first_seen_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  last_seen_at: new Date().toISOString(),
  idea_sources: [{
    id: "__locked_src__",
    post_url: "#",
    post_title: "Someone needs to build this already",
    post_body_excerpt: "I've been searching for a tool like this for months. Every solution I find is either too expensive or missing key features that we actually need day-to-day.",
    source_type: "reddit",
    subreddit: "SomebodyMakeThis",
    author_username: "u/locked",
    author_profile_url: "#",
    upvotes: 1243,
    comment_count: 187,
    posted_at: new Date().toISOString(),
    fetched_at: new Date().toISOString(),
  }],
};

const LockedIdeaCard = () => (
  <div className="relative rounded-2xl overflow-hidden">
    {/* Real IdeaCard layout, fully blurred */}
    <div className="blur-md pointer-events-none select-none">
      <IdeaCard {...LOCKED_IDEA_TEMPLATE} isSaved={false} onSave={() => {}} />
    </div>

    {/* Lock overlay */}
    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl z-10">
      <div className="text-center px-6">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Lock className="w-5 h-5 text-primary" />
        </div>
        <p className="text-sm font-semibold text-foreground mb-1">Upgrade to unlock</p>
        <p className="text-xs text-muted-foreground mb-4">
          Get full access to this idea, source posts, and author details
        </p>
        <button
          onClick={() => window.location.href = '/settings'}
          className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition"
        >
          Upgrade to Pro →
        </button>
      </div>
    </div>
  </div>
);

const GRADE_FILTERS = ["All", "A", "B", "C", "D"] as const;
const SOURCE_FILTERS = ["All", "Reddit", "HN", "Trends"] as const;
const DATE_FILTERS = ["All Time", "Today", "This Week", "This Month"] as const;

type GradeFilter = typeof GRADE_FILTERS[number];
type SourceFilter = typeof SOURCE_FILTERS[number];
type DateFilter = typeof DATE_FILTERS[number];

function getDateCutoff(filter: DateFilter): Date | null {
  const now = new Date();
  if (filter === "Today") {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (filter === "This Week") {
    const d = new Date(now);
    d.setDate(now.getDate() - 7);
    return d;
  }
  if (filter === "This Month") {
    const d = new Date(now);
    d.setDate(now.getDate() - 30);
    return d;
  }
  return null;
}

export default function Discover() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";
  const { user } = useAuth();

  const { data: subscription } = useUserSubscription(user?.id ?? "");
  const tier = (subscription?.tier ?? 'free') as string;
  const isAdmin = tier === 'admin';
  const isFree = tier === 'free' && !isAdmin;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const { data: allIdeas = [] } = useIdeas();
  const { data: viewedIdeas = [] } = useViewedIdeas(user?.id ?? "", isFree ? startOfToday.toISOString() : undefined);
  const ideas = isAdmin ? allIdeas : viewedIdeas;
  const { markRead, isRead } = useReadIdeas();
  const { data: savedIdeas = [] } = useSavedIdeas(user?.id ?? "");

  const [gradeFilter, setGradeFilter] = useState<GradeFilter>("All");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("All");
  const [dateFilter, setDateFilter] = useState<DateFilter>("All Time");
  const queryClient = useQueryClient();
  const { data: crawlsToday } = useUserCrawlsToday(user?.id ?? "");

  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [crawlLoading, setCrawlLoading] = useState(false);
  const [crawlError, setCrawlError] = useState<string | null>(null);
  const [crawlSuccess, setCrawlSuccess] = useState<string | null>(null);
  const [crawlStep, setCrawlStep] = useState<string | null>(null);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [bookmarkLimitOpen, setBookmarkLimitOpen] = useState(false);

  const handleRunCrawl = async () => {
    if (!isAdmin) {
      const dailyLimit = subscription?.crawls_per_day ?? 2;
      const sessionsToday = crawlsToday?.sessionsToday ?? 0;
      if (sessionsToday >= dailyLimit) {
        setLimitModalOpen(true);
        return;
      }
    }
    setCrawlLoading(true);
    setCrawlError(null);
    setCrawlSuccess(null);

    let progressCancelled = false;
    const stepLoop = (idx: number) => {
      if (progressCancelled) return;
      setCrawlStep(PROGRESS_STEPS[idx].label);
      setTimeout(() => stepLoop((idx + 1) % PROGRESS_STEPS.length), PROGRESS_STEPS[idx].duration);
    };
    stepLoop(0);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const { data: { session } } = await supabase.auth.getSession();
      const [response] = await Promise.all([
        fetch(`${apiUrl}/crawl/run`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`,
          },
        }),
        new Promise<void>(res => setTimeout(res, 4000)),
      ]);
      if (response.status === 409) {
        setCrawlError("A crawl is already running. Check back in a few minutes.");
        return;
      }
      if (response.status === 401) {
        setCrawlError("Please log in again.");
        return;
      }
      if (response.status === 429) {
        setLimitModalOpen(true);
        return;
      }
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        setCrawlError(err.message || "Failed to start crawl.");
        return;
      }
      const data = await response.json();
      if (data.simulated) {
        const count = data.ideas?.length ?? 0;
        setCrawlSuccess(`${count} new idea${count !== 1 ? "s" : ""} found!`);
        queryClient.invalidateQueries({ queryKey: ["viewed_ideas", user?.id] });
        queryClient.invalidateQueries({ queryKey: ["user_dashboard_stats", user?.id] });
        queryClient.invalidateQueries({ queryKey: ["user_crawls_today", user?.id] });
      } else {
        setCrawlSuccess("Crawl started in the background");
        queryClient.invalidateQueries({ queryKey: ["crawl_jobs"] });
      }
      setTimeout(() => setCrawlSuccess(null), 8000);
    } catch {
      setCrawlError("Cannot reach the API server. Run this command first: cd apps/api && python start.py");
    } finally {
      progressCancelled = true;
      setCrawlLoading(false);
      setCrawlStep(null);
    }
  };

  const handleSave = async (id: string) => {
    if (!user) {
      console.error("[handleSave] No authenticated user");
      return;
    }

    const alreadySaved = saved.has(id) || savedIdeas.some((s: any) => s.idea_id === id);

    if (isFree && !alreadySaved && savedIdeas.length >= 5) {
      setBookmarkLimitOpen(true);
      return;
    }

    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

    if (alreadySaved) {
      const { error } = await supabase
        .from("saved_ideas")
        .delete()
        .eq("user_id", user.id)
        .eq("idea_id", id);
      if (error) console.error("[handleSave] delete error:", error);
    } else {
      const { error } = await supabase
        .from("saved_ideas")
        .insert({ user_id: user.id, idea_id: id, saved_at: new Date().toISOString() });
      if (error) console.error("[handleSave] insert error:", error);
    }

    queryClient.invalidateQueries({ queryKey: ["saved_ideas", user.id] });
  };

  const q = searchQuery.toLowerCase();
  const dateCutoff = getDateCutoff(dateFilter);
  const filtered = ideas.filter((idea: any) => {
    const gradeOk = gradeFilter === "All" || idea.grade === gradeFilter;
    const srcOk = sourceFilter === "All" ||
      (sourceFilter === "Reddit" && idea.idea_sources?.some((s: any) => s.source_type === "reddit")) ||
      (sourceFilter === "HN" && idea.idea_sources?.some((s: any) => s.source_type === "hn")) ||
      (sourceFilter === "Trends" && idea.idea_sources?.some((s: any) => s.source_type === "google_trends"));
    const dateOk = !dateCutoff || new Date(idea.created_at) >= dateCutoff;
    const searchOk = !q ||
      idea.title?.toLowerCase().includes(q) ||
      idea.summary?.toLowerCase().includes(q);
    return gradeOk && srcOk && dateOk && searchOk;
  });

  return (
    <>
    <div className="max-w-[1200px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Discover Ideas</h1>
          {searchQuery ? (
            <p className="text-sm text-muted mt-1">
              Showing results for <span className="text-primary font-medium">"{searchQuery}"</span>
              {" "}— {filtered.length} idea{filtered.length !== 1 ? "s" : ""} found
            </p>
          ) : (
            <p className="text-sm text-muted mt-1">Fresh startup ideas crawled and graded for you.</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-3">
            <button
              onClick={handleRunCrawl}
              disabled={crawlLoading}
              className="gradient-primary text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${crawlLoading ? "animate-spin" : ""}`} />
              {crawlLoading ? "Running..." : isAdmin ? "Run Crawl" : "Discover Ideas"}
            </button>
            <button
              onClick={() => navigate("/settings")}
              className="bg-card text-foreground border border-border rounded-xl px-5 py-2.5 text-sm font-semibold flex items-center gap-2 hover:bg-secondary transition-colors"
            >
              <Settings className="w-4 h-4" /> Settings
            </button>
          </div>
          {crawlStep && (
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <RefreshCw className="w-3 h-3 animate-spin" />
              {crawlStep}
            </div>
          )}
          {crawlError && <p className="text-xs text-red-400">{crawlError}</p>}
          {crawlSuccess && <p className="text-xs text-green-400">{crawlSuccess}</p>}
        </div>
      </div>

      {!isFree && ideas.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <div className="flex gap-1 bg-secondary rounded-xl p-1">
            {GRADE_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setGradeFilter(f)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  gradeFilter === f ? "gradient-primary text-primary-foreground" : "text-foreground hover:bg-card"
                }`}
              >
                {f === "All" ? "All Grades" : `Grade ${f}`}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-secondary rounded-xl p-1">
            {SOURCE_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setSourceFilter(f)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  sourceFilter === f ? "gradient-primary text-primary-foreground" : "text-foreground hover:bg-card"
                }`}
              >
                {f === "All" ? "All Sources" : f}
              </button>
            ))}
          </div>
          <div className="ml-auto">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
              className="bg-secondary text-foreground text-sm font-medium rounded-xl px-4 py-2 border-none outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              {DATE_FILTERS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {isFree && ideas.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-6 text-center shadow-card">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">Run your first crawl to see ideas</h3>
          <p className="text-sm text-muted">
            Your free plan gives you 6 ideas per crawl, 2 crawls per day. Hit "Discover Ideas" above to get started.
          </p>
        </div>
      ) : isFree && ideas.length > 0 ? (
        <>
          {/* Soft upgrade nudge */}
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4 shadow-card mb-6">
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                Free plan — {ideas.length} idea{ideas.length !== 1 ? "s" : ""} this crawl
              </p>
              <p className="text-xs text-muted mt-0.5">
                Grade A ideas are hidden on the free plan. Upgrade to Pro for ~25 ideas / crawl, all grades, and advanced filters.
              </p>
            </div>
            <button
              onClick={() => navigate("/settings")}
              className="gradient-primary text-primary-foreground rounded-xl px-4 py-2 text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap flex-shrink-0"
            >
              Upgrade to Pro →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {ideas.map((idea: any) => (
              <IdeaCard
                key={idea.id}
                {...idea}
                isSaved={saved.has(idea.id) || savedIdeas.some((s: any) => s.idea_id === idea.id)}
                onSave={handleSave}
                isUnread={!isRead(idea.id)}
                onRead={() => markRead(idea.id)}
              />
            ))}
            {Array.from({ length: 18 }, (_, i) => (
              <LockedIdeaCard key={`extra-locked-${i}`} />
            ))}
          </div>
        </>
      ) : ideas.length === 0 ? (
        <div className="bg-card rounded-2xl p-10 text-center shadow-card">
          <Compass className="w-12 h-12 text-muted mx-auto mb-4" />
          <h3 className="text-base font-semibold text-foreground mb-2">No ideas yet</h3>
          {isAdmin ? (
            <>
              <p className="text-sm text-muted mb-5">Run your first crawl to discover ideas</p>
              <button
                onClick={() => navigate("/crawl-jobs")}
                className="gradient-primary text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Go to Crawl Jobs
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted mb-5">Click Discover Ideas to find your first batch of startup ideas</p>
              <button
                onClick={() => navigate("/dashboard")}
                className="gradient-primary text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Run Crawl →
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((idea: any) => (
              <IdeaCard
                key={idea.id}
                {...idea}
                isSaved={saved.has(idea.id) || savedIdeas.some((s: any) => s.idea_id === idea.id)}
                onSave={handleSave}
                isUnread={!isRead(idea.id)}
                onRead={() => markRead(idea.id)}
              />
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full bg-card rounded-2xl p-10 text-center shadow-card">
                <p className="text-sm text-muted">No ideas match the selected filters.</p>
              </div>
            )}
          </div>
          {!isAdmin && (
            <div className="mt-6 bg-card rounded-2xl p-4 text-center shadow-card border border-border">
              <p className="text-sm text-muted">
                You've seen all your ideas — run another crawl to discover more{" "}
                <button
                  onClick={() => navigate("/dashboard")}
                  className="text-primary font-semibold hover:underline"
                >
                  Run Crawl →
                </button>
              </p>
            </div>
          )}
        </>
      )}
    </div>

    <LimitReachedModal
      open={limitModalOpen}
      onClose={() => setLimitModalOpen(false)}
      tier={subscription?.tier ?? 'free'}
      nextResetAt={crawlsToday?.nextResetAt ?? null}
    />
    <BookmarkLimitModal
      open={bookmarkLimitOpen}
      onClose={() => setBookmarkLimitOpen(false)}
      onGoToSaved={() => { setBookmarkLimitOpen(false); navigate("/saved"); }}
    />
    </>
  );
}
