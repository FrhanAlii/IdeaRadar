import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";

const SOURCE_COLORS: Record<string, string> = {
  Reddit: "#4ade80",
  HN: "#f97316",
};

interface Props {
  data: { source: string; count: number }[];
}

export function SourceBreakdown({ data }: Props) {
  return (
    <div className="bg-card rounded-2xl p-5 shadow-card h-full">
      <h3 className="text-base font-semibold text-foreground mb-4">Source Breakdown</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="40%">
            <XAxis dataKey="source" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(220,9%,46%)" }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(220,9%,46%)" }} width={28} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={64}>
              <LabelList dataKey="count" position="top" style={{ fontSize: 12, fill: "hsl(220,9%,46%)" }} />
              {data.map((d, i) => (
                <Cell key={i} fill={SOURCE_COLORS[d.source] ?? "#6b7280"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
