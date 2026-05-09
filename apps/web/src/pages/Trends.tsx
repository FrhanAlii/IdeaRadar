import { useMemo, useState } from "react";
import { TrendingUp, Lightbulb, Star, Activity, Zap, X, Compass } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useIdeas, useViewedIdeas, useUserSubscription } from "@/hooks/useSupabaseData";
import { GradeBreakdown } from "@/components/dashboard/GradeBreakdown";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const STOP_WORDS = new Set([
  "the", "a", "an", "for", "with", "and", "to", "of", "in", "is", "it",
  "i", "my", "on", "at", "or", "this", "that", "how", "why", "what",
  "your", "we", "are", "can", "do", "be", "has", "was", "but", "not",
  "its", "have", "from", "as", "by", "into", "you", "app",
]);

const GRADE_COLORS: Record<string, string> = {
  A: "#4ade80", B: "#60a5fa", C: "#fbbf24", D: "#6b7280",
};

const SOURCE_META = [
  { key: "reddit",        label: "Reddit",        color: "#4ade80" },
  { key: "hn",            label: "HN",            color: "#f97316" },
  { key: "google_trends", label: "Google Trends", color: "#818cf8" },
];

export default function Trends() {
  const { user } = useAuth();
  const { data: subscription } = useUserSubscription(user?.id ?? "");
  const isAdmin = subscription?.tier === 'admin';

  const { data: allIdeas = [] } = useIdeas();
  const { data: viewedIdeas = [] } = useViewedIdeas(user?.id ?? "");
  const ideas = isAdmin ? allIdeas : viewedIdeas;

  const navigate = useNavigate();
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);

  // ── Stat cards ───────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = ideas.length;
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const thisWeek = (ideas as any[]).filter((i) => i.created_at >= weekAgo).length;
    const gradeA = (ideas as any[]).filter((i) => i.grade === "A").length;

    const sourceCounts: Record<string, number> = { reddit: 0, hn: 0, google_trends: 0 };
    (ideas as any[]).forEach((idea) => {
      const sources: any[] = idea.idea_sources ?? [];
      SOURCE_META.forEach(({ key }) => {
        if (sources.some((s) => s.source_type === key)) sourceCounts[key]++;
      });
    });

    const topSourceKey = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "reddit";
    const topSource = SOURCE_META.find((s) => s.key === topSourceKey)?.label ?? "Reddit";

    return { total, thisWeek, gradeA, topSource, sourceCounts };
  }, [ideas]);

  // ── Stacked area chart — last 14 days by source ──────────────────────────
  const areaData = useMemo(() => {
    const today = new Date();
    const days: { date: string; Reddit: number; HN: number; Trends: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push({ date: d.toISOString().split("T")[0].slice(5), Reddit: 0, HN: 0, Trends: 0 });
    }
    (ideas as any[]).forEach((idea) => {
      const day = (idea.created_at as string)?.split("T")[0]?.slice(5);
      const entry = days.find((d) => d.date === day);
      if (!entry) return;
      const sources: any[] = idea.idea_sources ?? [];
      if (sources.some((s) => s.source_type === "reddit"))        entry.Reddit++;
      if (sources.some((s) => s.source_type === "hn"))            entry.HN++;
      if (sources.some((s) => s.source_type === "google_trends")) entry.Trends++;
    });
    return days;
  }, [ideas]);

  // ── Grade breakdown ───────────────────────────────────────────────────────
  const gradeData = useMemo(() => {
    const counts: Record<string, number> = { A: 0, B: 0, C: 0 };
    (ideas as any[]).forEach((i) => { if (i.grade in counts) counts[i.grade]++; });
    return Object.entries(counts).map(([grade, count]) => ({ grade, count }));
  }, [ideas]);

  // ── Average scores ────────────────────────────────────────────────────────
  const avgScores = useMemo(() => {
    const scored = (ideas as any[]).filter((i) => i.score_demand != null);
    if (!scored.length) return { demand: 0, mobileFit: 0, monetization: 0, buildability: 0, competition: 0 };
    const avg = (key: string) =>
      Math.round((scored.reduce((s, i) => s + (i[key] ?? 0), 0) / scored.length) * 10) / 10;
    return {
      demand:       avg("score_demand"),
      mobileFit:    avg("score_mobile_fit"),
      monetization: avg("score_monetization"),
      buildability: avg("score_buildability"),
      competition:  avg("score_competition"),
    };
  }, [ideas]);

  // ── Top keywords (with counts) ────────────────────────────────────────────
  const keywords = useMemo(() => {
    const freq: Record<string, number> = {};
    (ideas as any[]).forEach((idea) => {
      (idea.title as string ?? "")
        .toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/)
        .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
        .forEach((w) => { freq[w] = (freq[w] ?? 0) + 1; });
    });
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([word, count]) => ({ word, count }));
  }, [ideas]);

  // ── Top ideas by demand score ─────────────────────────────────────────────
  const topIdeas = useMemo(() => {
    return [...(ideas as any[])]
      .filter((i) => i.score_demand != null)
      .sort((a, b) => (b.score_demand ?? 0) - (a.score_demand ?? 0))
      .slice(0, 5);
  }, [ideas]);

  if (ideas.length === 0) {
    return (
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Trends</h1>
          <p className="text-sm text-muted mt-1">
            {isAdmin ? "Insights across Reddit, HN and Google Trends." : "Topics from your discovered ideas."}
          </p>
        </div>
        <div className="bg-card rounded-2xl p-10 text-center shadow-card">
          {isAdmin ? (
            <>
              <TrendingUp className="w-12 h-12 text-muted mx-auto mb-4" />
              <h3 className="text-base font-semibold text-foreground mb-2">No trend data yet</h3>
              <p className="text-sm text-muted">Run a crawl to start seeing trends</p>
            </>
          ) : (
            <>
              <Compass className="w-12 h-12 text-muted mx-auto mb-4" />
              <h3 className="text-base font-semibold text-foreground mb-2">No trends yet</h3>
              <p className="text-sm text-muted mb-5">Run a crawl to start discovering ideas and track trends</p>
              <button
                onClick={() => navigate("/dashboard")}
                className="gradient-primary text-primary-foreground rounded-xl px-5 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Run Crawl →
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const scoreBars = [
    { label: "Demand",       desc: "Market interest + recency signal",      value: avgScores.demand,       color: "#4ade80" },
    { label: "Mobile Fit",   desc: "GPS / camera / notifications use case", value: avgScores.mobileFit,    color: "#60a5fa" },
    { label: "Monetization", desc: "Revenue ceiling for a solo dev",        value: avgScores.monetization, color: "#fbbf24" },
    { label: "Buildability", desc: "How fast a solo dev can ship v1",       value: avgScores.buildability, color: "#a78bfa" },
    { label: "Competition",  desc: "Higher = less competition (better)",    value: avgScores.competition,  color: "#f87171" },
  ];

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Trends</h1>
        <p className="text-sm text-muted mt-1">
          {isAdmin ? "Insights across Reddit, HN and Google Trends." : "Topics from your discovered ideas."}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Ideas",   value: stats.total,     icon: Lightbulb, color: "text-primary" },
          { label: "This Week",     value: stats.thisWeek,  icon: Activity,  color: "text-blue-400" },
          { label: "Grade A Ideas", value: stats.gradeA,    icon: Star,      color: "text-green-400" },
          { label: "Top Source",    value: stats.topSource, icon: Zap,       color: "text-orange-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl bg-secondary flex items-center justify-center ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] text-muted uppercase tracking-wide">{label}</p>
              <p className="text-lg font-bold text-foreground leading-tight">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Stacked area chart */}
      <div className="bg-card rounded-2xl p-5 shadow-card mb-6">
        <h2 className="text-base font-semibold text-foreground mb-4">Ideas discovered — last 14 days</h2>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={areaData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
            <defs>
              {[
                { id: "gradReddit",  color: "#4ade80" },
                { id: "gradHN",      color: "#f97316" },
                { id: "gradTrends",  color: "#818cf8" },
              ].map(({ id, color }) => (
                <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: 12, fontSize: 12,
              }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <Area type="monotone" dataKey="Reddit" stackId="1" name="Reddit"
              stroke="#4ade80" fill="url(#gradReddit)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="HN" stackId="1" name="HN"
              stroke="#f97316" fill="url(#gradHN)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="Trends" stackId="1" name="Trends"
              stroke="#818cf8" fill="url(#gradTrends)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 3-column row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Source breakdown */}
        <div className="bg-card rounded-2xl p-5 shadow-card">
          <h2 className="text-base font-semibold text-foreground mb-4">Source Breakdown</h2>
          <div className="space-y-4">
            {SOURCE_META.map(({ key, label, color }) => {
              const count = stats.sourceCounts[key] ?? 0;
              const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium text-foreground">{label}</span>
                    <span className="text-muted">{count} ideas · {pct}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Grade donut (reuse existing component) */}
        <GradeBreakdown data={gradeData} total={ideas.length} />

        {/* Average scores */}
        <div className="bg-card rounded-2xl p-5 shadow-card">
          <h2 className="text-base font-semibold text-foreground mb-1">Avg Idea Quality Scores</h2>
          <p className="text-[11px] text-muted mb-4">Average across all ideas · scale 0–100</p>
          <div className="space-y-3.5">
            {scoreBars.map(({ label, desc, value, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="font-medium text-foreground">{label}</span>
                  <span className="font-semibold" style={{ color }}>{value}/100</span>
                </div>
                <p className="text-[10px] text-muted mb-1">{desc}</p>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${value}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top keywords */}
      <div className="bg-card rounded-2xl p-5 shadow-card mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Top Keywords</h2>
            <p className="text-[11px] text-muted mt-0.5">Click any keyword to see all ideas that contain it</p>
          </div>
          {selectedKeyword && (
            <button
              onClick={() => setSelectedKeyword(null)}
              className="flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {keywords.map(({ word, count }) => {
            const isActive = selectedKeyword === word;
            return (
              <button
                key={word}
                onClick={() => setSelectedKeyword(isActive ? null : word)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground hover:bg-primary/10 hover:text-primary"
                }`}
              >
                {word}
                <span className={`text-[10px] rounded-full px-1.5 py-0.5 leading-tight ${
                  isActive ? "bg-white/20 text-white" : "bg-card text-muted"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {selectedKeyword && (() => {
          const matching = (ideas as any[]).filter((idea) =>
            (idea.title as string ?? "").toLowerCase().includes(selectedKeyword)
          );
          return (
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
                {matching.length} idea{matching.length !== 1 ? "s" : ""} containing "{selectedKeyword}"
              </p>
              <div className="space-y-1">
                {matching.map((idea) => {
                  const sources: any[] = idea.idea_sources ?? [];
                  const firstType = sources[0]?.source_type ?? "";
                  const src = SOURCE_META.find((s) => s.key === firstType);
                  return (
                    <div
                      key={idea.id}
                      onClick={() => navigate("/discover")}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-secondary cursor-pointer transition-colors"
                    >
                      <span
                        className="text-[11px] font-bold rounded-md px-2 py-0.5 shrink-0"
                        style={{
                          backgroundColor: `${GRADE_COLORS[idea.grade] ?? "#6b7280"}22`,
                          color: GRADE_COLORS[idea.grade] ?? "#6b7280",
                        }}
                      >
                        {idea.grade ?? "–"}
                      </span>
                      <span className="flex-1 text-sm text-foreground truncate">{idea.title}</span>
                      {src && (
                        <span
                          className="text-[10px] font-medium rounded-full px-2 py-0.5 shrink-0"
                          style={{ backgroundColor: `${src.color}22`, color: src.color }}
                        >
                          {src.label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Top ideas by demand score */}
      <div className="bg-card rounded-2xl p-5 shadow-card">
        <h2 className="text-base font-semibold text-foreground mb-4">Top Ideas by Demand Score</h2>
        <div className="space-y-1">
          {topIdeas.map((idea, idx) => {
            const sources: any[] = idea.idea_sources ?? [];
            const firstType = sources[0]?.source_type ?? "";
            const src = SOURCE_META.find((s) => s.key === firstType);
            return (
              <div
                key={idea.id}
                onClick={() => navigate("/discover")}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary cursor-pointer transition-colors"
              >
                <span className="text-sm font-bold text-muted w-5 text-center shrink-0">{idx + 1}</span>
                <span
                  className="text-[11px] font-bold rounded-md px-2 py-0.5 shrink-0"
                  style={{
                    backgroundColor: `${GRADE_COLORS[idea.grade] ?? "#6b7280"}22`,
                    color: GRADE_COLORS[idea.grade] ?? "#6b7280",
                  }}
                >
                  {idea.grade ?? "–"}
                </span>
                <span className="flex-1 text-sm text-foreground truncate">{idea.title}</span>
                {src && (
                  <span
                    className="text-[10px] font-medium rounded-full px-2 py-0.5 shrink-0"
                    style={{ backgroundColor: `${src.color}22`, color: src.color }}
                  >
                    {src.label}
                  </span>
                )}
                <span className="text-xs font-semibold text-muted shrink-0 w-10 text-right">
                  {idea.score_demand}/100
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
