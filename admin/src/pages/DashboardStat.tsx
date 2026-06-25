import type { ReactNode } from "react";
import { inr } from "../components/ui";
import { IOrders, IRupee } from "../components/icons";

export interface PeriodStats {
  periodOrders: number;
  periodRevenue: number;
  periodExpenses: number;
  periodProfit: number;
  periodComplimentary: number;
}

/** A single labelled metric tile used across the dashboard grids. */
export function Stat({
  label,
  value,
  sub,
  icon,
  valueColor,
}: Readonly<{ label: string; value: string; sub: string; icon: ReactNode; valueColor?: string }>) {
  return (
    <div className="stat">
      <div className="stat__icon">{icon}</div>
      <div className="stat__label">{label}</div>
      <div className="stat__value" style={valueColor ? { color: valueColor } : undefined}>{value}</div>
      <div className="stat__sub">{sub}</div>
    </div>
  );
}

/** Headline card for the selected date range: orders, revenue, expenses, net profit. */
export function PeriodSummary({ s }: Readonly<{ s: PeriodStats }>) {
  const profitColor = s.periodProfit >= 0 ? "#16a34a" : "#dc2626";
  return (
    <div className="card section-gap" style={{ padding: 20 }}>
      <div className="panel-title">Period summary</div>
      <div className="stat-grid">
        <Stat label="Orders" value={String(s.periodOrders)} sub="In selected range" icon={<IOrders />} />
        <Stat label="Revenue" value={inr(s.periodRevenue)} sub="In selected range" icon={<IRupee />} />
        <Stat
          label="Profit"
          value={inr(s.periodProfit)}
          sub="Revenue − cost (menu finance)"
          icon={<span style={{ color: profitColor }}>₹</span>}
          valueColor={profitColor}
        />
        <Stat label="Expenses" value={inr(s.periodExpenses)} sub="Tracked separately" icon={<IRupee />} />
        <Stat label="Complimentary" value={inr(s.periodComplimentary)} sub="Free items given" icon={<IRupee />} />
      </div>
    </div>
  );
}
