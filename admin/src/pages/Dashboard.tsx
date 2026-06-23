import { useQuery } from "@apollo/client";
import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { DASHBOARD } from "../graphql/queries";
import Layout from "../components/Layout";
import { Spinner, StatusBadge, inr, fmtDate } from "../components/ui";
import { IOrders, IRupee, IClock, IUsers } from "../components/icons";

interface TopItem { name: string; qty: number; revenue: number; }
interface RevPoint { date: string; revenue: number; orders: number; }
interface RecentOrder {
  id: string; orderNumber: string; total: number; status: string;
  placedAt: string; user?: { name: string } | null;
}
interface Stats {
  totalOrders: number; totalRevenue: number; todayOrders: number; todayRevenue: number;
  pendingOrders: number; totalCustomers: number; avgOrderValue: number;
  avgRating: number; ratingCount: number;
  topItems: TopItem[]; revenueByDay: RevPoint[]; recentOrders: RecentOrder[];
}

export default function Dashboard() {
  const { data, loading, error } = useQuery<{ dashboardStats: Stats }>(DASHBOARD);

  return (
    <Layout title="Dashboard">
      <DashboardContent
        loading={loading && !data}
        error={error?.message}
        stats={data?.dashboardStats}
      />
    </Layout>
  );
}

function DashboardContent({
  loading,
  error,
  stats,
}: Readonly<{ loading: boolean; error?: string; stats?: Stats }>) {
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
  return <Body s={stats} />;
}

function Body({ s }: Readonly<{ s: Stats }>) {
  const maxRev = Math.max(1, ...s.revenueByDay.map((d) => d.revenue));
  return (
    <>
      <div className="stat-grid">
        <Stat label="Today's revenue" value={inr(s.todayRevenue)} sub={`${s.todayOrders} orders today`} icon={<IRupee />} />
        <Stat label="Total revenue" value={inr(s.totalRevenue)} sub={`Avg ${inr(s.avgOrderValue)} / order`} icon={<IOrders />} />
        <Stat label="Pending orders" value={String(s.pendingOrders)} sub="Need attention" icon={<IClock />} />
        <Stat label="Customers" value={String(s.totalCustomers)} sub={`${s.totalOrders} lifetime orders`} icon={<IUsers />} />
        <Stat label="Customer rating" value={s.ratingCount ? `${s.avgRating} ★` : "—"} sub={`${s.ratingCount} rating(s)`} icon={<span>★</span>} />
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

function Stat({ label, value, sub, icon }: Readonly<{ label: string; value: string; sub: string; icon: React.ReactNode }>) {
  return (
    <div className="stat">
      <div className="stat__icon">{icon}</div>
      <div className="stat__label">{label}</div>
      <div className="stat__value">{value}</div>
      <div className="stat__sub">{sub}</div>
    </div>
  );
}
