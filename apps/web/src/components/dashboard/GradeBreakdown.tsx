import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const GRADE_COLORS: Record<string, string> = {
  A: "#4ade80",
  B: "#60a5fa",
  C: "#fbbf24",
  D: "#6b7280",
};

interface Props {
  data: { grade: string; count: number }[];
  total: number;
}

export function GradeBreakdown({ data, total }: Props) {
  const filled = data.some((d) => d.count > 0);
  const chartData = filled ? data.filter((d) => d.count > 0) : [{ grade: "–", count: 1 }];

  return (
    <div className="bg-card rounded-2xl p-5 shadow-card h-full flex flex-col items-center">
      <h3 className="text-base font-semibold text-foreground self-start mb-2">Grade Breakdown</h3>
      <div className="w-36 h-36 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={42} outerRadius={65}
              startAngle={90} endAngle={-270} dataKey="count" strokeWidth={0}>
              {chartData.map((d, i) => (
                <Cell key={i} fill={filled ? GRADE_COLORS[d.grade] ?? "#6b7280" : "hsl(var(--secondary))"} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{total}</span>
          <span className="text-[10px] text-muted">Total</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 justify-center">
        {data.map((d) => (
          <div key={d.grade} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: GRADE_COLORS[d.grade] }} />
            <span className="text-[11px] text-muted">Grade {d.grade}: <span className="font-semibold text-foreground">{d.count}</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}
