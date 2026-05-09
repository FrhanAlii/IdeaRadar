import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Settings, Compass } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { StatCards } from "@/components/dashboard/StatCards";
import { useAuth } from "@/contexts/AuthContext";
import {
  useDashboardStats,
  useUserSubscription,
  useUserDashboardStats,
  useUserIdeasOverTime,
  useUserGradeBreakdown,
  useUserSourceBreakdown,
  useUserTopIdeasToday,
  useUserCrawlsToday,
} from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import { IdeasOverTime } from "@/components/dashboard/IdeasOverTime";
import { GradeBreakdown } from "@/components/dashboard/GradeBreakdown";
import { SourceBreakdown } from "@/components/dashboard/SourceBreakdown";
import { TopIdeasToday } from "@/components/dashboard/TopIdeasToday";
import { RecentCrawls } from "@/components/dashboard/RecentCrawls";

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
    free:     { current: 2,   next: 'pro',     nextLabel: 'Pro — 5 crawls/day for $9/mo' },
    pro:      { current: 5,   next: 'pro_plus', nextLabel: 'Pro Plus — Unlimited for $29/mo' },
    pro_plus: { current: 999, next: '',         nextLabel: '' },
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

const PROGRESS_STEPS = [
  { label: "Searching Reddit...",         duration: 800 },
  { label: "Searching Hacker News...",    duration: 1100 },
  { label: "Grading posts...",            duration: 1400 },
  { label: "Clustering similar ideas...", duration: 900 },
  { label: "Finalizing...",               duration: 600 },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: subscription } = useUserSubscription(user?.id ?? "");
  const isAdmin = subscription?.tier === 'admin';

  // Admin: global stats + widgets
  const { data: stats } = useDashboardStats(user?.id ?? "");
  const { data: widgets } = useQuery({
    queryKey: ["dashboard_widgets"],
    queryFn: async () => {
      const cutoff14 = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
      const cutoff24 = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

      const results = await Promise.all([
        supabase.from("ideas").select("created_at").gte("created_at", cutoff14).order("created_at"),
        supabase.from("ideas").select("id", { count: "exact", head: true }).eq("grade", "A"),
        supabase.from("ideas").select("id", { count: "exact", head: true }).eq("grade", "B"),
        supabase.from("ideas").select("id", { count: "exact", head: true }).eq("grade", "C"),
        supabase.from("ideas").select("id", { count: "exact", head: true }).eq("grade", "D"),
        supabase.from("idea_sources").select("id", { count: "exact", head: true }).eq("source_type", "reddit"),
        supabase.from("idea_sources").select("id", { count: "exact", head: true }).eq("source_type", "hn"),
        supabase.from("ideas").select("id, title, grade, score_demand").gte("created_at", cutoff24).order("score_demand", { ascending: false }).limit(3),
        supabase.from("crawl_jobs").select("id, status, started_at, finished_at, ideas_new").order("started_at", { ascending: false }).limit(3),
      ]);

      const dayCounts: Record<string, number> = {};
      (results[0].data ?? []).forEach((row: any) => {
        const day = new Date(row.created_at).toLocaleDateString("en-US", { weekday: "short" });
        dayCounts[day] = (dayCounts[day] ?? 0) + 1;
      });

      return {
        overTime: Object.entries(dayCounts).map(([day, count]) => ({ day, count })),
        grades: [
          { grade: "A", count: results[1].count ?? 0 },
          { grade: "B", count: results[2].count ?? 0 },
          { grade: "C", count: results[3].count ?? 0 },
          { grade: "D", count: results[4].count ?? 0 },
        ],
        sources: [
          { source: "Reddit", count: results[5].count ?? 0 },
          { source: "HN",     count: results[6].count ?? 0 },
        ],
        topIdeas: (results[7].data ?? []) as { id: string; title: string; grade: string; score_demand: number }[],
        crawls:   (results[8].data ?? []) as { id: string; status: string; started_at: string; finished_at: string | null; ideas_new: number | null }[],
      };
    },
    enabled: !!user,
  });

  // Non-admin: user-scoped hooks
  const { data: userStats }         = useUserDashboardStats(user?.id ?? "");
  const { data: userOverTime = [] } = useUserIdeasOverTime(user?.id ?? "");
  const { data: userGrades = [] }   = useUserGradeBreakdown(user?.id ?? "");
  const { data: userSources = [] }  = useUserSourceBreakdown(user?.id ?? "");
  const { data: userTopIdeas = [] } = useUserTopIdeasToday(user?.id ?? "");

  // Route to correct data based on tier
  const displayStats    = isAdmin ? stats    : userStats;
  const displayOverTime = isAdmin ? (widgets?.overTime  ?? []) : userOverTime;
  const displayGrades   = isAdmin ? (widgets?.grades    ?? []) : userGrades;
  const displaySources  = isAdmin ? (widgets?.sources   ?? []) : userSources;
  const displayTopIdeas = isAdmin ? (widgets?.topIdeas  ?? []) : userTopIdeas;
  const gradeTotal = (displayGrades as any[]).reduce((s, d) => s + d.count, 0);

  const { data: crawlsToday } = useUserCrawlsToday(user?.id ?? "");

  const [crawlLoading, setCrawlLoading] = useState(false);
  const [crawlError, setCrawlError] = useState<string | null>(null);
  const [crawlSuccess, setCrawlSuccess] = useState<string | null>(null);
  const [crawlStep, setCrawlStep] = useState<string | null>(null);
  const [limitModalOpen, setLimitModalOpen] = useState(false);

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
        setCrawlError("A crawl is already running. Check the Crawl Jobs page.");
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
        queryClient.invalidateQueries({ queryKey: ["dashboard_widgets"] });
        queryClient.invalidateQueries({ queryKey: ["user_dashboard_stats", user?.id] });
        queryClient.invalidateQueries({ queryKey: ["viewed_ideas", user?.id] });
      } else {
        setCrawlSuccess("Crawl started in the background");
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

  return (
    <>
    <div className="max-w-[1200px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted mt-1">Your idea discovery overview.</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-3">
            <button
              onClick={handleRunCrawl}
              disabled={crawlLoading}
              className="gradient-primary text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${crawlLoading ? "animate-spin" : ""}`} />
              {crawlLoading ? "Running..." : "Run Crawl"}
            </button>
            <button onClick={() => navigate("/settings")} className="bg-card text-foreground border border-border rounded-xl px-5 py-2.5 text-sm font-semibold flex items-center gap-2 hover:bg-secondary transition-colors">
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

      <StatCards
        totalIdeas={displayStats?.totalIdeas ?? 0}
        aGradeIdeas={displayStats?.aGradeIdeas ?? 0}
        savedIdeas={displayStats?.savedIdeas ?? 0}
        lastCrawlHours={displayStats?.lastCrawlHours ?? null}
        totalIdeasTitle={isAdmin ? undefined : "Ideas Discovered"}
        lastCrawlTitle={isAdmin ? undefined : "Last Run"}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">
        <div className="lg:col-span-5">
          <IdeasOverTime data={displayOverTime} />
        </div>
        <div className="lg:col-span-3">
          <TopIdeasToday ideas={displayTopIdeas} onNavigate={() => navigate("/discover")} />
        </div>
        <div className="lg:col-span-4">
          <GradeBreakdown data={displayGrades} total={gradeTotal} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">
        <div className="lg:col-span-5">
          <SourceBreakdown data={displaySources} />
        </div>
        <div className="lg:col-span-7">
          {isAdmin ? (
            <RecentCrawls crawls={widgets?.crawls ?? []} />
          ) : (displayStats?.totalIdeas ?? 0) === 0 ? (
            <div className="bg-card rounded-2xl p-10 text-center shadow-card h-full flex flex-col items-center justify-center">
              <Compass className="w-12 h-12 text-muted mx-auto mb-4" />
              <h3 className="text-base font-semibold text-foreground mb-2">Run your first crawl to see your dashboard</h3>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="gradient-primary text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Run Crawl →
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>

    <LimitReachedModal
      open={limitModalOpen}
      onClose={() => setLimitModalOpen(false)}
      tier={subscription?.tier ?? 'free'}
      nextResetAt={crawlsToday?.nextResetAt ?? null}
    />
    </>
  );
}
