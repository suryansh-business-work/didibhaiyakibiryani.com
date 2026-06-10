import { inr } from "../../components/ui";
import { TYPE_LABEL, describeCoupon, type Coupon } from "./types";

interface CouponsTableProps {
  coupons: Coupon[];
  onEdit: (coupon: Coupon) => void;
  onDelete: (coupon: Coupon) => void;
}

export default function CouponsTable({
  coupons,
  onEdit,
  onDelete,
}: Readonly<CouponsTableProps>) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Offer</th>
            <th>Min order</th>
            <th>Flags</th>
            <th>Used</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {coupons.map((c) => (
            <tr key={c.id}>
              <td>
                <div className="t-strong" style={{ letterSpacing: 1 }}>
                  {c.code}
                </div>
                <div className="muted" style={{ fontSize: "0.78rem" }}>
                  {c.title}
                </div>
              </td>
              <td>
                <span className="badge badge--gold">{TYPE_LABEL[c.type]}</span>
                <div className="muted" style={{ fontSize: "0.8rem", marginTop: 4 }}>
                  {describeCoupon(c)}
                </div>
              </td>
              <td className="muted">{c.minOrder ? inr(c.minOrder) : "—"}</td>
              <td>
                <div className="tags-inline">
                  {c.firstOrderOnly && <span className="badge badge--blue">1st order</span>}
                  {c.appOnly && <span className="badge badge--muted">App only</span>}
                </div>
              </td>
              <td className="muted">
                {c.usedCount}
                {c.usageLimit ? ` / ${c.usageLimit}` : ""}
              </td>
              <td>
                <span className={`badge ${c.isActive ? "badge--green" : "badge--muted"}`}>
                  <span className="dot" />
                  {c.isActive ? "Active" : "Off"}
                </span>
              </td>
              <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                <button className="btn btn-ghost btn-sm" onClick={() => onEdit(c)}>
                  Edit
                </button>{" "}
                <button className="btn btn-danger btn-sm" onClick={() => onDelete(c)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
