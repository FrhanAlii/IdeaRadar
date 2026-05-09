import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  data: { day: string; count: number }[];
}

export function IdeasOverTime({ data }: Props) {
  return (
    <div className="bg-card rounded-2xl p-5 shadow-card h-full">
      <h3 className="text-base font-semibold text-foreground mb-4">Ideas Found Over Time</h3>
      {data.length === 0 ? (
        <div className="h-48 flex items-center justify-center">
          <p className="text-sm text-muted">Run a crawl to see data</p>
        </div>
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(220,9%,46%)" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(220,9%,46%)" }} width={28} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Line type="monotone" dataKey="count" stroke="hsl(152,36%,52%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(152,36%,52%)" }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
