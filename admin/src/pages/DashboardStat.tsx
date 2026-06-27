import type { ReactNode } from "react";
import { inr } from "../components/ui";
import { IOrders, IRupee } from "../components/icons";

export interface PeriodStats {
  periodOrders: number;
  periodRevenue: number;
  periodExpenses: number;
  expenseCategoryCount: number;
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
  onClick,
}: Readonly<{ label: string; value: string; sub: string; icon: ReactNode; valueColor?: string; onClick?: () => void }>) {
  return (
    <div
      className="stat"
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={onClick ? { cursor: "pointer" } : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") onClick(); } : undefined}
    >
      <div className="stat__icon">{icon}</div>
      <div className="stat__label">{label}</div>
      <div className="stat__value" style={valueColor ? { color: valueColor } : undefined}>{value}</div>
      <div className="stat__sub">{sub}</div>
    </div>
  );
}

/** Headline card for the selected date range: orders, revenue, profit, expenses, complimentary. */
export function PeriodSummary({
  s,
  onProfitClick,
  onComplimentaryClick,
}: Readonly<{ s: PeriodStats; onProfitClick?: () => void; onComplimentaryClick?: () => void }>) {
  const profitColor = s.periodProfit >= 0 ? "#16a34a" : "#dc2626";
  const categoryLabel = s.expenseCategoryCount === 1 ? "1 category" : `${s.expenseCategoryCount} categories`;
  return (
    <div className="card section-gap" style={{ padding: 20 }}>
      <div className="panel-title">Period summary</div>
      <div className="stat-grid">
        <Stat label="Orders" value={String(s.periodOrders)} sub="In selected range" icon={<IOrders />} />
        <Stat label="Revenue" value={inr(s.periodRevenue)} sub="In selected range" icon={<IRupee />} />
        <Stat
          label="Profit"
          value={inr(s.periodProfit)}
          sub="Per-item profit · tap to view"
          icon={<span style={{ color: profitColor }}>₹</span>}
          valueColor={profitColor}
          onClick={onProfitClick}
        />
        <Stat label="Expenses" value={inr(s.periodExpenses)} sub={`${categoryLabel} with spend`} icon={<IRupee />} />
        <Stat label="Complimentary" value={inr(s.periodComplimentary)} sub="Free items given · tap to view" icon={<IRupee />} onClick={onComplimentaryClick} />
      </div>
    </div>
  );
}
