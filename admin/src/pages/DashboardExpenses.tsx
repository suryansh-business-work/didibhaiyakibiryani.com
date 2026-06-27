import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js";
import { Box, Typography } from "@mui/material";
import { inr } from "../components/ui";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export interface ExpenseStat {
  name: string;
  color?: string | null;
  total: number;
}

const TICK = "#cdbfb0";
const GRID = "rgba(255,255,255,0.07)";
const GOLD = "#e4b65c";
const PIE_COLORS = ["#e4b65c", "#e0584b", "#5fb45f", "#64b5f6", "#ba68c8", "#ffb74d", "#4db6ac", "#f06292", "#9575cd", "#a1887f"];

const barOptions: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (ctx) => inr(Number(ctx.parsed.y)) } },
  },
  scales: {
    x: { ticks: { color: TICK }, grid: { display: false } },
    y: { ticks: { color: TICK, callback: (v) => inr(Number(v)) }, grid: { color: GRID } },
  },
};

const pieOptions: ChartOptions<"pie"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: "right", labels: { color: TICK, boxWidth: 12 } },
    tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${inr(Number(ctx.parsed))}` } },
  },
};

function ChartCard({ title, hasData, children }: Readonly<{ title: string; hasData: boolean; children: React.ReactNode }>) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="panel-title">{title}</div>
      {hasData ? <Box sx={{ height: 300, mt: 1 }}>{children}</Box> : <Typography className="muted" sx={{ py: 4, textAlign: "center" }}>No expenses in this period.</Typography>}
    </div>
  );
}

/** Dashboard "Expenses" section — spend by source (bar) and by raw item (pie). */
export function DashboardExpenses({ bySource, byItem }: Readonly<{ bySource: ExpenseStat[]; byItem: ExpenseStat[] }>) {
  const barData = {
    labels: bySource.map((e) => e.name),
    datasets: [{ label: "Spend", data: bySource.map((e) => e.total), backgroundColor: bySource.map((e) => e.color || GOLD), borderRadius: 6 }],
  };
  const pieData = {
    labels: byItem.map((e) => e.name),
    datasets: [{ data: byItem.map((e) => e.total), backgroundColor: byItem.map((_, i) => PIE_COLORS[i % PIE_COLORS.length]), borderWidth: 0 }],
  };

  return (
    <div className="section-gap">
      <Typography variant="h6" sx={{ mb: 1.5 }}>Expenses</Typography>
      <div className="grid-2">
        <ChartCard title="Spend by source" hasData={bySource.length > 0}>
          <Bar data={barData} options={barOptions} />
        </ChartCard>
        <ChartCard title="Raw items used (by spend)" hasData={byItem.length > 0}>
          <Pie data={pieData} options={pieOptions} />
        </ChartCard>
      </div>
    </div>
  );
}
