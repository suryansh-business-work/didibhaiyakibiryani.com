import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { CUSTOMERS } from "../graphql/queries";
import { UPDATE_CUSTOMER, DELETE_CUSTOMER } from "../graphql/mutations";
import Layout from "../components/Layout";
import { AsyncList, Modal, inr, fmtDate } from "../components/ui";
import { ISearch } from "../components/icons";
import { useAlert, useConfirm } from "../components/dialog";

interface Customer {
  id: string; name: string; email: string; phone?: string;
  createdAt: string; orderCount: number; totalSpent: number;
}

export default function Customers() {
  const [search, setSearch] = useState("");
  const { data, loading, refetch } = useQuery<{ customers: Customer[] }>(CUSTOMERS, {
    variables: { search: search || null },
  });
  const [updateCustomer] = useMutation(UPDATE_CUSTOMER);
  const [deleteCustomer] = useMutation(DELETE_CUSTOMER);
  const confirm = useConfirm();
  const notify = useAlert();

  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const customers = data?.customers ?? [];

  function openEdit(c: Customer) {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone ?? "" });
    setErr("");
  }

  async function save() {
    if (!editing) return;
    if (!form.name.trim()) {
      setErr("Name is required.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      await updateCustomer({
        variables: { id: editing.id, name: form.name.trim(), phone: form.phone.trim() || null },
      });
      setEditing(null);
      await refetch();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(c: Customer) {
    const ok = await confirm({
      title: "Delete customer",
      message: `Delete “${c.name}”? Their account is permanently removed. This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    setDeletingId(c.id);
    try {
      await deleteCustomer({ variables: { id: c.id } });
      await refetch();
    } catch (e: unknown) {
      await notify({
        title: "Could not delete",
        message: e instanceof Error ? e.message : "Could not delete the customer.",
      });
    } finally {
      setDeletingId(null);
    }
  }

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
                <tr>
                  <th>Name</th><th>Contact</th><th>Joined</th><th>Orders</th>
                  <th style={{ textAlign: "right" }}>Lifetime value</th><th></th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td className="t-strong">{c.name}</td>
                    <td className="muted">{c.email}<div style={{ fontSize: "0.78rem" }}>{c.phone}</div></td>
                    <td className="muted">{fmtDate(c.createdAt)}</td>
                    <td><span className="badge badge--gold">{c.orderCount}</span></td>
                    <td className="t-mono t-strong" style={{ textAlign: "right" }}>{inr(c.totalSpent)}</td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>Edit</button>{" "}
                      <button className="btn btn-danger btn-sm" disabled={deletingId === c.id} onClick={() => remove(c)}>
                        {deletingId === c.id ? "…" : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncList>
      </div>

      {editing && (
        <Modal
          title={`Edit ${editing.name}`}
          onClose={() => setEditing(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-gold" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</button>
            </>
          }
        >
          <div className="field">
            <label>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field">
            <label>Phone</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <p className="muted" style={{ fontSize: "0.8rem" }}>Email ({editing.email}) is the login id and can't be changed here.</p>
          {err && <div className="error-text">{err}</div>}
        </Modal>
      )}
    </Layout>
  );
}
