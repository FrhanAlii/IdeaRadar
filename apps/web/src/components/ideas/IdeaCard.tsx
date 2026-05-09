import { useState } from "react";
import { createPortal } from "react-dom";
import { Bookmark, ArrowUp, ChevronDown, ChevronUp, Copy, ExternalLink, X, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface IdeaSource {
  id: string;
  post_url: string;
  post_title: string;
  post_body_excerpt: string;
  source_type: string;
  subreddit: string | null;
  author_username: string;
  author_profile_url: string;
  upvotes: number;
  comment_count: number;
  posted_at: string | null;
  fetched_at: string;
}

interface IdeaCardProps {
  id: string;
  title: string;
  summary: string;
  grade: "A" | "B" | "C" | "D";
  score_demand: number;
  score_mobile_fit: number;
  score_monetization: number;
  score_buildability: number;
  score_competition: number;
  source_count: number;
  unique_users: number;
  total_upvotes: number;
  total_comments: number;
  first_seen_at: string;
  last_seen_at: string;
  idea_sources?: IdeaSource[];
  isSaved?: boolean;
  onSave?: (id: string) => void;
}

const gradeBadge: Record<string, string> = {
  A: "bg-green-100 text-green-700",
  B: "bg-blue-100 text-blue-700",
  C: "bg-amber-100 text-amber-700",
  D: "bg-red-100 text-red-700",
};

const scoreLabels = [
  { label: "Demand",       key: "score_demand" },
  { label: "Mobile Fit",   key: "score_mobile_fit" },
  { label: "Monetize",     key: "score_monetization" },
  { label: "Buildability", key: "score_buildability" },
  { label: "Competition",  key: "score_competition" },
] as const;

const modalScoreLabels = [
  { label: "Demand",        key: "score_demand" },
  { label: "Mobile Fit",    key: "score_mobile_fit" },
  { label: "Monetization",  key: "score_monetization" },
  { label: "Buildability",  key: "score_buildability" },
  { label: "Competition",   key: "score_competition" },
] as const;

export function IdeaCard({
  id, title, summary, grade,
  score_demand, score_mobile_fit, score_monetization, score_buildability, score_competition,
  total_upvotes, source_count, unique_users, first_seen_at,
  idea_sources = [],
  isSaved, onSave,
}: IdeaCardProps) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const scores: Record<string, number> = {
    score_demand, score_mobile_fit, score_monetization, score_buildability, score_competition,
  };

  const primarySource = idea_sources[0];
  const evidence = primarySource?.post_body_excerpt;
  const sourceType = primarySource?.source_type;
  const subreddit = primarySource?.subreddit;

  const handleCopy = (sourceId: string, username: string) => {
    navigator.clipboard.writeText(username);
    setCopied(sourceId);
    setTimeout(() => setCopied(null), 1500);
  };

  const modal = (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={() => setModalOpen(false)}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setModalOpen(false)}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-secondary transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-muted" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-2 mb-2">
          <span className={`rounded-lg px-2.5 py-1 text-sm font-bold flex-shrink-0 ${gradeBadge[grade] ?? gradeBadge.D}`}>
            {grade}
          </span>
          <p className="font-semibold text-foreground text-lg leading-snug flex-1 pr-6">{title}</p>
        </div>
        <p className="text-xs text-muted mb-5">
          {source_count} post{source_count !== 1 ? "s" : ""} · {unique_users} user{unique_users !== 1 ? "s" : ""} · {total_upvotes} total upvotes
        </p>

        {/* Summary */}
        <p className="text-xs text-muted uppercase font-semibold tracking-wide mb-1">Summary</p>
        <p className="text-sm text-muted mb-5">{summary}</p>

        {/* Score breakdown */}
        <div className="mb-5 space-y-2">
          {modalScoreLabels.map(({ label, key }) => (
            <div key={key} className="flex items-center gap-2">
              <span className="w-28 text-xs text-muted flex-shrink-0">{label}</span>
              <div className="flex-1 h-2 bg-secondary rounded-full">
                <div
                  className="h-2 bg-primary rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, scores[key]))}%` }}
                />
              </div>
              <span className="w-6 text-xs text-muted text-right">{scores[key]}</span>
            </div>
          ))}
        </div>

        {/* Source posts */}
        {idea_sources.length > 0 && (
          <>
            <p className="text-xs text-muted uppercase font-semibold tracking-wide mb-3">
              Source Posts ({idea_sources.length})
            </p>
            {idea_sources.map((src) => (
              <div key={src.id} className="border border-border rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${
                    src.source_type === "reddit" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                  }`}>
                    {src.source_type}
                  </span>
                  {src.subreddit && (
                    <span className="text-xs text-muted">r/{src.subreddit}</span>
                  )}
                  <span className="text-xs text-muted">
                    {src.source_type === "reddit" ? "u/" : ""}{src.author_username}
                  </span>
                  <span className="text-xs text-muted flex items-center gap-0.5">
                    <ArrowUp className="w-3 h-3" />{src.upvotes}
                  </span>
                </div>
                <div className="border-t border-border mb-3" />
                <p className="text-sm font-medium text-foreground mb-2">{src.post_title}</p>
                <p className="text-sm italic text-muted mb-3">
                  {src.post_body_excerpt || "No excerpt available"}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleCopy(src.id, src.author_username)}
                    className="text-xs text-muted hover:text-foreground flex items-center gap-1 transition-colors"
                  >
                    <Copy className={`w-3 h-3 ${copied === src.id ? "text-green-500" : ""}`} />
                    <span className={copied === src.id ? "text-green-500" : ""}>
                      {copied === src.id ? "Copied!" : "Copy username"}
                    </span>
                  </button>
                  {src.post_url && (
                    <a
                      href={src.post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> View Post →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-card rounded-2xl p-5 shadow-card transition-all duration-150 hover:shadow-elevated">
      <div className="flex items-start gap-2">
        <span className={`rounded-lg px-2.5 py-1 text-sm font-bold flex-shrink-0 ${gradeBadge[grade] ?? gradeBadge.D}`}>
          {grade}
        </span>
        <p className="font-semibold text-foreground flex-1 leading-snug">{title}</p>
        <button
          onClick={() => onSave?.(id)}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-secondary transition-colors"
          aria-label={isSaved ? "Unsave" : "Save"}
        >
          <Bookmark
            className={`w-4 h-4 transition-colors ${isSaved ? "fill-primary text-primary" : "text-muted hover:text-primary"}`}
          />
        </button>
      </div>

      {evidence && (
        <p className="italic text-sm text-muted border-l-2 border-primary pl-3 line-clamp-2 mt-3">
          {evidence}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5 mt-3">
        {sourceType && (
          <span className="text-xs bg-secondary rounded-full px-2 py-0.5">{sourceType}</span>
        )}
        {subreddit && (
          <span className="text-xs bg-secondary rounded-full px-2 py-0.5">r/{subreddit}</span>
        )}
        <span className="text-xs bg-secondary rounded-full px-2 py-0.5 flex items-center gap-1">
          <ArrowUp className="w-3 h-3" />{total_upvotes}
        </span>
        {source_count > 1 && (
          <span className="text-xs bg-secondary rounded-full px-2 py-0.5">{source_count} sources</span>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {scoreLabels.map(({ label, key }) => (
          <div key={key} className="flex items-center gap-2">
            <span className="w-24 text-xs text-muted flex-shrink-0">{label}</span>
            <div className="flex-1 h-1.5 bg-secondary rounded-full">
              <div
                className="h-1.5 bg-primary rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, scores[key]))}%` }}
              />
            </div>
            <span className="w-6 text-xs text-muted text-right">{scores[key]}</span>
          </div>
        ))}
      </div>

      {/* Bottom row: discovered + View More */}
      <div className="flex justify-between mt-4 pt-3 border-t border-border">
        <span className="text-xs text-muted">
          discovered {formatDistanceToNow(new Date(first_seen_at), { addSuffix: true })}
        </span>
        <button
          onClick={() => setModalOpen(true)}
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          <FileText className="w-3 h-3" /> View More
        </button>
      </div>

      {/* Collapsible sources */}
      {idea_sources.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setSourcesOpen((o) => !o)}
            className="flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors w-full"
          >
            {sourcesOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {idea_sources.length} source{idea_sources.length !== 1 ? "s" : ""}
          </button>

          {sourcesOpen && (
            <div className="mt-2 space-y-0">
              {idea_sources.map((src, i) => (
                <div key={src.id}>
                  {i > 0 && <div className="border-t border-border my-2" />}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <span className={`text-xs font-semibold rounded-full px-2 py-0.5 flex-shrink-0 ${
                        src.source_type === "reddit" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                      }`}>
                        {src.source_type}
                      </span>
                      {src.subreddit && (
                        <span className="text-xs text-muted truncate">r/{src.subreddit}</span>
                      )}
                      <span className="text-xs text-muted truncate">
                        {src.source_type === "reddit" ? "u/" : ""}{src.author_username}
                      </span>
                      <span className="text-xs text-muted flex items-center gap-0.5 flex-shrink-0">
                        <ArrowUp className="w-3 h-3" />{src.upvotes}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      <button
                        onClick={() => handleCopy(src.id, src.author_username)}
                        className="p-1 rounded hover:bg-secondary transition-colors"
                        aria-label="Copy username"
                      >
                        <Copy className={`w-3 h-3 ${copied === src.id ? "text-green-500" : "text-muted"}`} />
                      </button>
                      {src.post_url && (
                        <a
                          href={src.post_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 rounded hover:bg-secondary transition-colors"
                          aria-label="Open post"
                        >
                          <ExternalLink className="w-3 h-3 text-muted" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {modalOpen && createPortal(modal, document.body)}
    </div>
  );
}
