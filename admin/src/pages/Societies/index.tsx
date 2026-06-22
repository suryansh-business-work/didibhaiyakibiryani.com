import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { SOCIETIES } from "../../graphql/queries";
import { CREATE_SOCIETY, UPDATE_SOCIETY, DELETE_SOCIETY } from "../../graphql/mutations";
import Layout from "../../components/Layout";
import { AsyncList, Modal } from "../../components/ui";
import { IPlus } from "../../components/icons";
import { useAlert, useConfirm } from "../../components/dialog";

interface Society {
  id: string;
  name: string;
  area?: string;
  pincode?: string;
  sortOrder: number;
  isActive: boolean;
}

const BLANK = { name: "", area: "", pincode: "", sortOrder: 0, isActive: true };

export default function Societies() {
  const { data, loading, refetch } = useQuery<{ societies: Society[] }>(SOCIETIES);
  const [create] = useMutation(CREATE_SOCIETY);
  const [update] = useMutation(UPDATE_SOCIETY);
  const [del] = useMutation(DELETE_SOCIETY);

  const confirm = useConfirm();
  const notify = useAlert();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Society | null>(null);
  const [form, setForm] = useState({ ...BLANK });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const societies = data?.societies ?? [];

  function openNew() {
    setEditing(null);
    setForm({ ...BLANK });
    setErr("");
    setOpen(true);
  }
  function openEdit(s: Society) {
    setEditing(s);
    setForm({
      name: s.name,
      area: s.area ?? "",
      pincode: s.pincode ?? "",
      sortOrder: s.sortOrder,
      isActive: s.isActive,
    });
    setErr("");
    setOpen(true);
  }

  async function save() {
    if (!form.name.trim()) {
      setErr("Name is required.");
      return;
    }
    setBusy(true);
    setErr("");
    const input = {
      name: form.name.trim(),
      area: form.area.trim(),
      pincode: form.pincode.trim(),
      sortOrder: Number(form.sortOrder),
      isActive: form.isActive,
    };
    try {
      if (editing) await update({ variables: { id: editing.id, input } });
      else await create({ variables: { input } });
      setOpen(false);
      await refetch();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(s: Society) {
    const ok = await confirm({
      title: "Delete society",
      message: `Delete society “${s.name}”?`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await del({ variables: { id: s.id } });
      await refetch();
    } catch (e: unknown) {
      await notify({
        title: "Could not delete",
        message: e instanceof Error ? e.message : "Could not delete.",
      });
    }
  }

  return (
    <Layout title="Societies">
      <div className="toolbar">
        <div className="spacer" />
        <button className="btn btn-gold" onClick={openNew}>
          <IPlus size={16} /> New society
        </button>
      </div>

      <div className="card">
        <AsyncList loading={loading && !data} empty={societies.length === 0} emptyLabel="No societies yet.">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Area</th>
                  <th>Pincode</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {societies.map((s) => (
                  <tr key={s.id}>
                    <td className="t-strong">{s.name}</td>
                    <td className="muted">{s.area || "—"}</td>
                    <td className="muted">{s.pincode || "—"}</td>
                    <td className="muted">{s.sortOrder}</td>
                    <td>
                      <span className={`badge ${s.isActive ? "badge--green" : "badge--muted"}`}>
                        <span className="dot" />
                        {s.isActive ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}>
                        Edit
                      </button>{" "}
                      <button className="btn btn-danger btn-sm" onClick={() => remove(s)}>
                        Delete
                      </button>
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
          title={editing ? "Edit society" : "New society"}
          onClose={() => setOpen(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-gold" onClick={save} disabled={busy}>
                {busy ? "Saving…" : "Save"}
              </button>
            </>
          }
        >
          <div className="field">
            <label>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Prestige Lakeside" />
          </div>
          <div className="field">
            <label>Area (optional)</label>
            <input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="e.g. Whitefield" />
          </div>
          <div className="field">
            <label>Pincode (optional)</label>
            <input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
          </div>
          <div className="field">
            <label>Sort order</label>
            <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
          </div>
          <label className="check">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active
          </label>
          {err && <div className="error-text">{err}</div>}
        </Modal>
      )}
    </Layout>
  );
}
