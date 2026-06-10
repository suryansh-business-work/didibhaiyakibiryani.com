import { Spinner, Empty, inr } from "../../components/ui";
import type { Item } from "./types";

interface MenuTableProps {
  items: Item[];
  loading: boolean;
  onEdit: (item: Item) => void;
  onToggle: (item: Item) => void;
  onDelete: (item: Item) => void;
}

function badgeClass(badge: string): string {
  return badge === "NEW" ? "badge--green" : "badge--gold";
}

export default function MenuTable({
  items,
  loading,
  onEdit,
  onToggle,
  onDelete,
}: Readonly<MenuTableProps>) {
  if (loading) {
    return <Spinner />;
  }
  if (items.length === 0) {
    return <Empty>No menu items yet.</Empty>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Category</th>
            <th>Spice</th>
            <th>Available</th>
            <th style={{ textAlign: "right" }}>Price</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id}>
              <td>
                <div className="t-strong">
                  {it.name}{" "}
                  {it.badge !== "NONE" && (
                    <span className={`badge ${badgeClass(it.badge)}`}>{it.badge}</span>
                  )}
                </div>
                <div
                  className="muted"
                  style={{
                    fontSize: "0.78rem",
                    maxWidth: 360,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {it.description}
                </div>
              </td>
              <td className="muted">{it.category?.name ?? "—"}</td>
              <td>
                {it.spiceLevel > 0 ? (
                  "🌶️".repeat(it.spiceLevel)
                ) : (
                  <span className="muted">mild</span>
                )}
              </td>
              <td>
                <button
                  className={`badge ${it.isAvailable ? "badge--green" : "badge--muted"}`}
                  onClick={() => onToggle(it)}
                  title="Toggle availability"
                >
                  <span className="dot" />
                  {it.isAvailable ? "Live" : "Off"}
                </button>
              </td>
              <td className="t-mono" style={{ textAlign: "right" }}>
                {inr(it.price)}
              </td>
              <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                <button className="btn btn-ghost btn-sm" onClick={() => onEdit(it)}>
                  Edit
                </button>{" "}
                <button className="btn btn-danger btn-sm" onClick={() => onDelete(it)}>
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
