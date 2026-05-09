import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export function ProjectProgress() {
  const tasks: any[] = [];
  const isLoading = false;

  const total = tasks?.length ?? 0;
  const completed = tasks?.filter((t) => t.status === "done").length ?? 0;
  const inProgress = tasks?.filter((t) => t.status === "inprogress" || t.status === "review").length ?? 0;
  const pending = tasks?.filter((t) => t.status === "todo").length ?? 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const data = [
    { name: "Completed", value: completed || 1, color: "hsl(152,36%,52%)" },
    { name: "In Progress", value: inProgress || 1, color: "hsl(153,48%,19%)" },
    { name: "Pending", value: pending || 1, color: "hsl(153,48%,19%,0.15)" },
  ];

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-5 shadow-card h-full animate-pulse">
        <div className="h-5 bg-secondary rounded w-36 mb-4" />
        <div className="h-40 bg-secondary rounded-full w-40 mx-auto" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-5 shadow-card h-full flex flex-col items-center">
      <h3 className="text-base font-semibold text-foreground self-start mb-2">Project Progress</h3>
      <div className="w-40 h-40 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={70}
              startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{pct}%</span>
          <span className="text-[10px] text-muted">Project Ended</span>
        </div>
      </div>
      <div className="flex gap-4 mt-3">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-[10px] text-muted">{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
