import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { Box, Rating, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { startOfDay, endOfDay } from "date-fns";
import { DASHBOARD } from "../graphql/queries";
import Layout from "../components/Layout";
import { Spinner, StatusBadge, inr, fmtDate } from "../components/ui";
import { IOrders, IRupee, IClock, IUsers } from "../components/icons";
import DashboardFilter, { rangeForPreset, type Preset, type DateRange } from "./DashboardFilter";
import { Stat, PeriodSummary } from "./DashboardStat";
import ProfitDialog from "./ProfitDialog";

interface TopItem { name: string; qty: number; revenue: number; }
interface DishRating { name: string; rating: number; count: number; }
interface RevPoint { date: string; revenue: number; orders: number; }
interface RecentOrder {
  id: string; orderNumber: string; total: number; status: string;
  placedAt: string; user?: { name: string } | null;
}
interface Stats {
  totalOrders: number; totalRevenue: number; todayOrders: number; todayRevenue: number;
  pendingOrders: number; totalCustomers: number; totalLeads: number; repeatCustomers: number; avgOrderValue: number;
  avgFoodRating: number; avgDeliveryRating: number; ratingCount: number;
  periodOrders: number; periodRevenue: number; periodExpenses: number; periodProfit: number; periodComplimentary: number;
  dishRatings: DishRating[];
  topItems: TopItem[]; revenueByDay: RevPoint[]; recentOrders: RecentOrder[];
}

function customRange(from: Date | null, to: Date | null): DateRange {
  return {
    from: from ? startOfDay(from).toISOString() : undefined,
    to: to ? endOfDay(to).toISOString() : undefined,
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [preset, setPreset] = useState<Preset>("month");
  const [customFrom, setCustomFrom] = useState<Date | null>(null);
  const [customTo, setCustomTo] = useState<Date | null>(null);
  const [profitOpen, setProfitOpen] = useState(false);

  const range = useMemo<DateRange>(
    () => (preset === "custom" ? customRange(customFrom, customTo) : rangeForPreset(preset)),
    [preset, customFrom, customTo]
  );

  const { data, loading, error } = useQuery<{ dashboardStats: Stats }>(DASHBOARD, {
    variables: range,
  });

  return (
    <Layout title="Dashboard">
      <DashboardFilter
        preset={preset}
        customFrom={customFrom}
        customTo={customTo}
        onPreset={setPreset}
        onCustomFrom={setCustomFrom}
        onCustomTo={setCustomTo}
      />
      <DashboardContent
        loading={loading && !data}
        error={error?.message}
        stats={data?.dashboardStats}
        onProfitClick={() => setProfitOpen(true)}
        onComplimentaryClick={() => navigate("/complimentary")}
      />
      {profitOpen && <ProfitDialog range={range} onClose={() => setProfitOpen(false)} />}
    </Layout>
  );
}

function DashboardContent({
  loading,
  error,
  stats,
  onProfitClick,
  onComplimentaryClick,
}: Readonly<{ loading: boolean; error?: string; stats?: Stats; onProfitClick: () => void; onComplimentaryClick: () => void }>) {
  if (loading) {
    return <Spinner label="Crunching numbers…" />;
  }
  if (error) {
    return (
      <div className="card" style={{ padding: 24 }}>
        <p className="error-text">{error}</p>
        <p className="muted" style={{ marginTop: 8 }}>
          Make sure the server is running and MONGODB_URI is set.
        </p>
      </div>
    );
  }
  if (!stats) {
    return null;
  }
  return <Body s={stats} onProfitClick={onProfitClick} onComplimentaryClick={onComplimentaryClick} />;
}

function Body({
  s,
  onProfitClick,
  onComplimentaryClick,
}: Readonly<{ s: Stats; onProfitClick: () => void; onComplimentaryClick: () => void }>) {
  const maxRev = Math.max(1, ...s.revenueByDay.map((d) => d.revenue));
  return (
    <>
      <PeriodSummary s={s} onProfitClick={onProfitClick} onComplimentaryClick={onComplimentaryClick} />

      <div className="stat-grid section-gap">
        <Stat label="Today's revenue" value={inr(s.todayRevenue)} sub={`${s.todayOrders} orders today`} icon={<IRupee />} />
        <Stat label="Total revenue" value={inr(s.totalRevenue)} sub={`Avg ${inr(s.avgOrderValue)} / order`} icon={<IOrders />} />
        <Stat label="Pending orders" value={String(s.pendingOrders)} sub="Need attention" icon={<IClock />} />
        <Stat
          label="Customers"
          value={String(s.totalCustomers + s.totalLeads)}
          sub={`${s.totalCustomers} signup + ${s.totalLeads} manual contacts`}
          icon={<IUsers />}
        />
        <Stat label="Repeat customers" value={String(s.repeatCustomers)} sub="ordered more than once" icon={<IUsers />} />
        <Stat label="Food rating" value={s.ratingCount ? `${s.avgFoodRating} ★` : "—"} sub={`${s.ratingCount} rating(s)`} icon={<span>★</span>} />
        <Stat label="Delivery rating" value={s.ratingCount ? `${s.avgDeliveryRating} ★` : "—"} sub={`${s.ratingCount} rating(s)`} icon={<span>★</span>} />
      </div>

      <div className="grid-2 section-gap">
        <div className="card" style={{ padding: 20 }}>
          <div className="panel-title">Revenue · last 7 days</div>
          {s.revenueByDay.length === 0 ? (
            <p className="muted">No revenue yet.</p>
          ) : (
            <div className="chart">
              {s.revenueByDay.map((d) => (
                <div className="chart__col" key={d.date}>
                  <span className="chart__val">{inr(d.revenue)}</span>
                  <div className="chart__bar" style={{ height: `${(d.revenue / maxRev) * 100}%` }} />
                  <span className="chart__label">
                    {new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div className="panel-title">Top sellers</div>
          {s.topItems.length === 0 ? (
            <p className="muted">No sales yet.</p>
          ) : (
            <Table size="small">
              <TableBody>
                {s.topItems.map((t, i) => (
                  <TableRow key={t.name}>
                    <TableCell sx={{ width: 28 }}><Typography variant="body2" color="text.secondary">{i + 1}</Typography></TableCell>
                    <TableCell><Typography fontWeight={700}>{t.name}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{t.qty} sold</Typography></TableCell>
                    <TableCell align="right"><Typography sx={{ fontVariantNumeric: "tabular-nums" }}>{inr(t.revenue)}</Typography></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <div className="card section-gap" style={{ padding: 20 }}>
        <div className="panel-title">Dish ratings</div>
        {s.dishRatings.length === 0 ? (
          <p className="muted">No dish ratings yet.</p>
        ) : (
          <Table size="small">
            <TableBody>
              {s.dishRatings.map((d) => (
                <TableRow key={d.name}>
                  <TableCell><Typography fontWeight={700}>{d.name}</Typography></TableCell>
                  <TableCell><Rating value={d.rating} precision={0.5} readOnly size="small" /></TableCell>
                  <TableCell align="right"><Typography variant="body2" color="text.secondary">{d.rating} ★ · {d.count} rating(s)</Typography></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="card section-gap" style={{ padding: 20 }}>
        <div className="panel-title">Recent orders</div>
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Order</TableCell><TableCell>Customer</TableCell><TableCell>Status</TableCell>
                <TableCell>Placed</TableCell><TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {s.recentOrders.map((o) => (
                <TableRow key={o.id} hover>
                  <TableCell><Typography fontWeight={700}>{o.orderNumber}</Typography></TableCell>
                  <TableCell>{o.user?.name ?? "—"}</TableCell>
                  <TableCell><StatusBadge status={o.status} /></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{fmtDate(o.placedAt)}</Typography></TableCell>
                  <TableCell align="right"><Typography sx={{ fontVariantNumeric: "tabular-nums" }}>{inr(o.total)}</Typography></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </div>
    </>
  );
}

