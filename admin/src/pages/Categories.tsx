import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { CATEGORIES } from "../graphql/queries";
import { CREATE_CATEGORY, UPDATE_CATEGORY, DELETE_CATEGORY } from "../graphql/mutations";
import Layout from "../components/Layout";
import { AsyncList, Modal } from "../components/ui";
import { IPlus } from "../components/icons";
import { useAlert, useConfirm } from "../components/dialog";

interface Cat {
  id: string; name: string; description?: string; sortOrder: number;
  isActive: boolean; itemCount: number;
}
const BLANK = { name: "", description: "", sortOrder: 0, isActive: true };

export default function Categories() {
  const { data, loading, refetch } = useQuery<{ categories: Cat[] }>(CATEGORIES);
  const [create] = useMutation(CREATE_CATEGORY);
  const [update] = useMutation(UPDATE_CATEGORY);
  const [del] = useMutation(DELETE_CATEGORY);

  const confirm = useConfirm();
  const notify = useAlert();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cat | null>(null);
  const [form, setForm] = useState({ ...BLANK });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const cats = data?.categories ?? [];

  function openNew() { setEditing(null); setForm({ ...BLANK }); setErr(""); setOpen(true); }
  function openEdit(c: Cat) {
    setEditing(c);
    setForm({ name: c.name, description: c.description ?? "", sortOrder: c.sortOrder, isActive: c.isActive });
    setErr(""); setOpen(true);
  }

  async function save() {
    if (!form.name.trim()) { setErr("Name is required."); return; }
    setBusy(true); setErr("");
    const input = { name: form.name.trim(), description: form.description, sortOrder: Number(form.sortOrder), isActive: form.isActive };
    try {
      if (editing) await update({ variables: { id: editing.id, input } });
      else await create({ variables: { input } });
      setOpen(false); await refetch();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not save.");
    } finally { setBusy(false); }
  }

  async function remove(c: Cat) {
    const ok = await confirm({
      title: "Delete category",
      message: `Delete category “${c.name}”?`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await del({ variables: { id: c.id } });
      await refetch();
    } catch (e: unknown) {
      await notify({
        title: "Could not delete",
        message: e instanceof Error ? e.message : "Could not delete.",
      });
    }
  }

  return (
    <Layout title="Categories">
      <div className="toolbar">
        <div className="spacer" />
        <button className="btn btn-gold" onClick={openNew}><IPlus size={16} /> New category</button>
      </div>

      <div className="card">
        <AsyncList loading={loading && !data} empty={cats.length === 0} emptyLabel="No categories yet.">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Description</th><th>Items</th><th>Order</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {cats.map((c) => (
                  <tr key={c.id}>
                    <td className="t-strong">{c.name}</td>
                    <td className="muted">{c.description || "—"}</td>
                    <td className="muted">{c.itemCount}</td>
                    <td className="muted">{c.sortOrder}</td>
                    <td><span className={`badge ${c.isActive ? "badge--green" : "badge--muted"}`}><span className="dot" />{c.isActive ? "Active" : "Hidden"}</span></td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>Edit</button>{" "}
                      <button className="btn btn-danger btn-sm" onClick={() => remove(c)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncList>
      </div>

      {open && (
        <Modal
          title={editing ? "Edit category" : "New category"}
          onClose={() => setOpen(false)}
          footer={<>
            <button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-gold" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</button>
          </>}
        >
          <div className="field"><label>Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="field"><label>Description</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="field"><label>Sort order</label><input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} /></div>
          <label className="check"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
          {err && <div className="error-text">{err}</div>}
        </Modal>
      )}
    </Layout>
  );
}
