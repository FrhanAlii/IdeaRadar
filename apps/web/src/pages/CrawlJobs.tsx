import { useState } from "react";
import { createPortal } from "react-dom";
import { RefreshCw, Compass } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCrawlJobs, useUserSubscription, useUserCrawlSessions, useUserCrawlsToday } from "@/hooks/useSupabaseData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const statusBadge: Record<string, string> = {
  running: "bg-blue-100 text-blue-700",
  done:    "bg-green-100 text-green-700",
  failed:  "bg-red-100 text-red-700",
};

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

export default function CrawlJobs() {
  const { user } = useAuth();
  const { data: subscription } = useUserSubscription(user?.id ?? "");
  const isAdmin = subscription?.tier === 'admin';

  const { data: jobs = [] } = useCrawlJobs();
  const { data: sessions = [] } = useUserCrawlSessions(user?.id ?? "");
  const rows = isAdmin ? jobs : sessions;

  const queryClient = useQueryClient();

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
        queryClient.invalidateQueries({ queryKey: ["user_crawl_sessions", user?.id] });
        queryClient.invalidateQueries({ queryKey: ["user_dashboard_stats", user?.id] });
        queryClient.invalidateQueries({ queryKey: ["viewed_ideas", user?.id] });
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

  return (
    <>
    <div className="max-w-[1200px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isAdmin ? "Crawl Jobs" : "My Crawl History"}
          </h1>
          <p className="text-sm text-muted mt-1">
            {isAdmin ? "History of your automated crawl runs." : "Your personal idea discovery sessions."}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={handleRunCrawl}
            disabled={crawlLoading}
            className="gradient-primary text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${crawlLoading ? "animate-spin" : ""}`} />
            {crawlLoading ? "Running..." : isAdmin ? "Run Now" : "Discover Ideas"}
          </button>
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

      {(rows as any[]).length === 0 ? (
        <div className="bg-card rounded-2xl p-10 text-center shadow-card">
          {isAdmin ? (
            <>
              <RefreshCw className="w-12 h-12 text-muted mx-auto mb-4" />
              <h3 className="text-base font-semibold text-foreground mb-2">No crawl jobs yet</h3>
              <p className="text-sm text-muted">Click Run Now to start your first crawl</p>
            </>
          ) : (
            <>
              <Compass className="w-12 h-12 text-muted mx-auto mb-4" />
              <h3 className="text-base font-semibold text-foreground mb-2">No crawls yet</h3>
              <p className="text-sm text-muted">Click Discover Ideas to get your first batch of startup ideas</p>
            </>
          )}
        </div>
      ) : (
        <div className="bg-card rounded-2xl shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {isAdmin ? (
                  <>
                    <TableHead>Started At</TableHead>
                    <TableHead>Sources</TableHead>
                    <TableHead>Posts Scanned</TableHead>
                    <TableHead>Ideas Found</TableHead>
                    <TableHead>Status</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead>Ran At</TableHead>
                    <TableHead>Ideas Discovered</TableHead>
                    <TableHead>Status</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isAdmin
                ? (jobs as any[]).map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="text-sm text-foreground">
                        {new Date(job.started_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted">{job.sources ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted">{job.posts_scanned ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted">{job.ideas_found ?? "—"}</TableCell>
                      <TableCell>
                        <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${statusBadge[job.status] ?? "bg-secondary text-muted"}`}>
                          {job.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                : (sessions as any[]).map((session) => (
                    <TableRow key={session.started_at}>
                      <TableCell className="text-sm text-foreground">
                        {new Date(session.started_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted">{session.ideas_found}</TableCell>
                      <TableCell>
                        <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${statusBadge[session.status] ?? "bg-secondary text-muted"}`}>
                          {session.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
              }
            </TableBody>
          </Table>
        </div>
      )}

      <LimitReachedModal
        open={limitModalOpen}
        onClose={() => setLimitModalOpen(false)}
        tier={subscription?.tier ?? 'free'}
        nextResetAt={crawlsToday?.nextResetAt ?? null}
      />
    </div>
    </>
  );
}
