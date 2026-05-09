const GRADE_COLORS: Record<string, string> = {
  A: "#4ade80",
  B: "#60a5fa",
  C: "#fbbf24",
  D: "#6b7280",
};

interface Idea {
  id: string;
  title: string;
  grade: string;
  score_demand: number;
}

interface Props {
  ideas: Idea[];
  onNavigate: () => void;
}

export function TopIdeasToday({ ideas, onNavigate }: Props) {
  return (
    <div className="bg-card rounded-2xl p-5 shadow-card h-full flex flex-col">
      <h3 className="text-base font-semibold text-foreground mb-4">Top Ideas Today</h3>
      <div className="flex-1 flex flex-col gap-3">
        {ideas.length === 0 ? (
          <p className="text-sm text-muted">No new ideas today</p>
        ) : (
          ideas.map((idea) => (
            <div
              key={idea.id}
              onClick={onNavigate}
              className="flex items-center gap-3 cursor-pointer hover:bg-secondary rounded-xl px-3 py-2 transition-colors"
            >
              <span
                className="text-[11px] font-bold rounded-md px-2 py-0.5 shrink-0"
                style={{ backgroundColor: `${GRADE_COLORS[idea.grade]}22`, color: GRADE_COLORS[idea.grade] }}
              >
                {idea.grade}
              </span>
              <span className="flex-1 text-sm text-foreground truncate">{idea.title}</span>
              <span className="text-xs text-muted shrink-0">{idea.score_demand ?? 0}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
