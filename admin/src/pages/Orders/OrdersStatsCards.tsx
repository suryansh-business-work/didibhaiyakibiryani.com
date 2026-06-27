import { useQuery } from "@apollo/client";
import { ORDERS_STATS } from "../../graphql/queries";
import { Stat } from "../DashboardStat";
import { inr } from "../../components/ui";
import { IOrders, IClock, IRupee } from "../../components/icons";

interface Stats {
  totalOrders: number;
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  totalRevenue: number;
}

/** Headline insight cards shown above the Orders table. */
export default function OrdersStatsCards() {
  const { data } = useQuery<{ ordersStats: Stats }>(ORDERS_STATS);
  const s = data?.ordersStats;
  if (!s) return null;
  return (
    <div className="stat-grid section-gap" style={{ marginBottom: "20px" }}>
      <Stat label="Total orders" value={String(s.totalOrders)} sub={`${s.todayOrders} today`} icon={<IOrders />} />
      <Stat label="Today's orders" value={String(s.todayOrders)} sub={`${inr(s.todayRevenue)} today`} icon={<IClock />} />
      <Stat label="Pending orders" value={String(s.pendingOrders)} sub="Need attention" icon={<IClock />} />
      <Stat label="Total revenue" value={inr(s.totalRevenue)} sub="Paid / active orders" icon={<IRupee />} />
    </div>
  );
}
