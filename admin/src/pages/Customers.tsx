import { useState } from "react";
import { useQuery } from "@apollo/client";
import { CUSTOMERS } from "../graphql/queries";
import Layout from "../components/Layout";
import { AsyncList, inr, fmtDate } from "../components/ui";
import { ISearch } from "../components/icons";

interface Customer {
  id: string; name: string; email: string; phone?: string;
  createdAt: string; orderCount: number; totalSpent: number;
}

export default function Customers() {
  const [search, setSearch] = useState("");
  const { data, loading } = useQuery<{ customers: Customer[] }>(CUSTOMERS, {
    variables: { search: search || null },
  });
  const customers = data?.customers ?? [];

  return (
    <Layout title="Customers">
      <div className="toolbar">
        <div className="search">
          <ISearch size={16} />
          <input
            placeholder="Search name, email, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="spacer" />
        <span className="muted">{customers.length} customer(s)</span>
      </div>

      <div className="card">
        <AsyncList loading={loading && !data} empty={customers.length === 0} emptyLabel="No customers found.">
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Contact</th><th>Joined</th><th>Orders</th><th style={{ textAlign: "right" }}>Lifetime value</th></tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td className="t-strong">{c.name}</td>
                    <td className="muted">{c.email}<div style={{ fontSize: "0.78rem" }}>{c.phone}</div></td>
                    <td className="muted">{fmtDate(c.createdAt)}</td>
                    <td><span className="badge badge--gold">{c.orderCount}</span></td>
                    <td className="t-mono t-strong" style={{ textAlign: "right" }}>{inr(c.totalSpent)}</td>
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
