interface CrawlJob {
  id: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  ideas_new: number | null;
}

interface Props {
  crawls: CrawlJob[];
}

const STATUS_STYLES: Record<string, string> = {
  done:    "bg-green-500/20 text-green-400",
  failed:  "bg-red-500/20 text-red-400",
  running: "bg-blue-500/20 text-blue-400",
  partial: "bg-amber-500/20 text-amber-400",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function duration(started: string, finished: string | null) {
  if (!finished) return "--";
  return Math.round((+new Date(finished) - +new Date(started)) / 60000) + " min";
}

export function RecentCrawls({ crawls }: Props) {
  return (
    <div className="bg-card rounded-2xl p-5 shadow-card h-full">
      <h3 className="text-base font-semibold text-foreground mb-4">Recent Crawls</h3>
      {crawls.length === 0 ? (
        <p className="text-sm text-muted">No crawls yet</p>
      ) : (
        <div className="flex flex-col gap-3">
          {crawls.map((c) => (
            <div key={c.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
              <span className={`text-[11px] font-semibold rounded-md px-2 py-0.5 shrink-0 ${STATUS_STYLES[c.status] ?? "bg-secondary text-muted"}`}>
                {c.status}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground">{formatDate(c.started_at)}</p>
                <p className="text-[11px] text-muted">{c.ideas_new ?? 0} new ideas · {duration(c.started_at, c.finished_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
