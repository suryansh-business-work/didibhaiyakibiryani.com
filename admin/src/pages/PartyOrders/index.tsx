import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { PARTY_ORDERS } from "../../graphql/queries";
import { UPDATE_PARTY_ORDER_STATUS } from "../../graphql/mutations";
import Layout from "../../components/Layout";
import { AsyncList, fmtDate } from "../../components/ui";
import { useAlert } from "../../components/dialog";

interface Party {
  id: string;
  name: string;
  phone: string;
  email: string;
  eventDate?: string;
  guests?: number;
  location?: string;
  message?: string;
  status: "NEW" | "CONTACTED" | "CLOSED";
  createdAt: string;
}

const STATUSES = ["NEW", "CONTACTED", "CLOSED"] as const;
const FILTERS = ["ALL", ...STATUSES] as const;

export default function PartyOrders() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("ALL");
  const { data, loading, refetch } = useQuery<{ partyOrders: Party[] }>(PARTY_ORDERS, {
    variables: { status: filter === "ALL" ? null : filter },
  });
  const [updateStatus] = useMutation(UPDATE_PARTY_ORDER_STATUS);
  const notify = useAlert();

  const orders = data?.partyOrders ?? [];

  async function changeStatus(id: string, status: string) {
    try {
      await updateStatus({ variables: { id, status } });
      await refetch();
    } catch (e: unknown) {
      await notify({
        title: "Could not update",
        message: e instanceof Error ? e.message : "Could not update the status.",
      });
    }
  }

  return (
    <Layout title="Party Orders">
      <div className="toolbar">
        <div className="chips">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`chip ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <div className="spacer" />
      </div>

      <div className="card">
        <AsyncList loading={loading && !data} empty={orders.length === 0} emptyLabel="No party enquiries yet.">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Event</th>
                  <th>Guests</th>
                  <th>Details</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="muted">{fmtDate(o.createdAt)}</td>
                    <td className="t-strong">{o.name}</td>
                    <td className="muted">
                      <div>{o.phone}</div>
                      <div>{o.email}</div>
                    </td>
                    <td className="muted">
                      <div>{o.eventDate || "—"}</div>
                      {o.location ? <div>{o.location}</div> : null}
                    </td>
                    <td className="muted">{o.guests ?? "—"}</td>
                    <td className="muted" style={{ maxWidth: 280, whiteSpace: "pre-wrap" }}>
                      {o.message || "—"}
                    </td>
                    <td>
                      <select
                        value={o.status}
                        onChange={(e) => changeStatus(o.id, e.target.value)}
                        style={{
                          padding: "7px 10px",
                          borderRadius: 8,
                          background: "var(--bg-soft)",
                          border: "1px solid var(--border-strong)",
                          color: "var(--text)",
                          fontSize: "0.85rem",
                        }}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s.charAt(0) + s.slice(1).toLowerCase()}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncList>
      </div>
    </Layout>
  );
}
