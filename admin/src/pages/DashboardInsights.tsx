import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js";
import { Box, Typography } from "@mui/material";
import { inr } from "../components/ui";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Filler, Tooltip, Legend);

export interface RevPoint { date: string; revenue: number; orders: number; }
export interface StatusStat { status: string; count: number; }

const TICK = "#cdbfb0";
const GRID = "rgba(255,255,255,0.07)";
const GOLD = "#e4b65c";
const STATUS_COLORS: Record<string, string> = {
  PLACED: "#64b5f6",
  CONFIRMED: "#9575cd",
  PREPARING: "#ffb74d",
  OUT_FOR_DELIVERY: "#4db6ac",
  DELIVERED: "#5fb45f",
  CANCELLED: "#e0584b",
};

function statusLabel(s: string): string {
  return s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ");
}

const lineOptions: ChartOptions<"line"> = {
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

const doughOptions: ChartOptions<"doughnut"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: "right", labels: { color: TICK, boxWidth: 12 } } },
};

function Card({ title, hasData, empty, children }: Readonly<{ title: string; hasData: boolean; empty: string; children: React.ReactNode }>) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="panel-title">{title}</div>
      {hasData ? <Box sx={{ height: 300, mt: 1 }}>{children}</Box> : <Typography className="muted" sx={{ py: 4, textAlign: "center" }}>{empty}</Typography>}
    </div>
  );
}

/** Main-dashboard insight charts: revenue trend (line) + orders by status (doughnut). */
export function DashboardInsights({ revenueByDay, ordersByStatus }: Readonly<{ revenueByDay: RevPoint[]; ordersByStatus: StatusStat[] }>) {
  const lineData = {
    labels: revenueByDay.map((d) => new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })),
    datasets: [{ label: "Revenue", data: revenueByDay.map((d) => d.revenue), borderColor: GOLD, backgroundColor: "rgba(228,182,92,0.18)", fill: true, tension: 0.35, pointRadius: 3 }],
  };
  const doughData = {
    labels: ordersByStatus.map((o) => statusLabel(o.status)),
    datasets: [{ data: ordersByStatus.map((o) => o.count), backgroundColor: ordersByStatus.map((o) => STATUS_COLORS[o.status] ?? GOLD), borderWidth: 0 }],
  };

  return (
    <div className="grid-2 section-gap">
      <Card title="Revenue · last 7 days" hasData={revenueByDay.length > 0} empty="No revenue yet.">
        <Line data={lineData} options={lineOptions} />
      </Card>
      <Card title="Orders by status" hasData={ordersByStatus.length > 0} empty="No orders yet.">
        <Doughnut data={doughData} options={doughOptions} />
      </Card>
    </div>
  );
}
