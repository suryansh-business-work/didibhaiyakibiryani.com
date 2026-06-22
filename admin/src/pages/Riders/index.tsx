import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { RIDERS } from "../../graphql/queries";
import { CREATE_STAFF_USER, UPDATE_STAFF_USER, DELETE_STAFF_USER } from "../../graphql/mutations";
import Layout from "../../components/Layout";
import { AsyncList } from "../../components/ui";
import { IPlus } from "../../components/icons";
import { useAlert, useConfirm } from "../../components/dialog";
import RiderModal from "./RiderModal";
import { BLANK_RIDER, validateRiderForm, type RiderForm, type RiderRow } from "./types";

export default function Riders() {
  const { data, loading, refetch } = useQuery<{ riders: RiderRow[] }>(RIDERS);
  const [createStaff] = useMutation(CREATE_STAFF_USER);
  const [updateStaff] = useMutation(UPDATE_STAFF_USER);
  const [deleteStaff] = useMutation(DELETE_STAFF_USER);

  const confirm = useConfirm();
  const notify = useAlert();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RiderForm>({ ...BLANK_RIDER });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const riders = data?.riders ?? [];

  function openNew() {
    setEditingId(null);
    setForm({ ...BLANK_RIDER });
    setErr("");
    setOpen(true);
  }

  function openEdit(r: RiderRow) {
    setEditingId(r.id);
    setForm({ name: r.name, email: r.email, phone: r.phone ?? "", password: "", isActive: r.isActive });
    setErr("");
    setOpen(true);
  }

  async function save() {
    const problem = validateRiderForm(form, editingId !== null);
    if (problem) {
      setErr(problem);
      return;
    }
    setBusy(true);
    setErr("");
    try {
      if (editingId) {
        await updateStaff({
          variables: {
            id: editingId,
            name: form.name.trim(),
            phone: form.phone.trim() || null,
            password: form.password || null,
            isActive: form.isActive,
          },
        });
      } else {
        await createStaff({
          variables: {
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim() || null,
            password: form.password,
            role: "DELIVERY",
          },
        });
      }
      setOpen(false);
      await refetch();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not save the rider.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(r: RiderRow) {
    const ok = await confirm({
      title: "Delete delivery partner",
      message: `Delete “${r.name}”? They will no longer be able to sign in. This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    setDeletingId(r.id);
    try {
      await deleteStaff({ variables: { id: r.id } });
      await refetch();
    } catch (e: unknown) {
      await notify({
        title: "Could not delete",
        message: e instanceof Error ? e.message : "Could not delete the rider.",
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Layout title="Delivery partners">
      <div className="toolbar">
        <p className="muted" style={{ margin: 0 }}>
          Riders sign in on the delivery portal to pick up and deliver assigned orders.
        </p>
        <div className="spacer" />
        <button className="btn btn-gold" onClick={openNew}>
          <IPlus size={16} /> New rider
        </button>
      </div>

      <div className="card">
        <AsyncList
          loading={loading && !data}
          empty={riders.length === 0}
          emptyLabel="No delivery partners yet — create the first one."
        >
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {riders.map((r) => (
                  <tr key={r.id}>
                    <td className="t-strong">{r.name}</td>
                    <td className="muted">{r.email}</td>
                    <td className="muted">{r.phone ?? "—"}</td>
                    <td>
                      <span className={`badge ${r.isActive ? "badge--green" : "badge--muted"}`}>
                        <span className="dot" />
                        {r.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}>Edit</button>{" "}
                      <button
                        className="btn btn-danger btn-sm"
                        disabled={deletingId === r.id}
                        onClick={() => remove(r)}
                      >
                        {deletingId === r.id ? "Deleting…" : "Delete"}
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
        <RiderModal
          form={form}
          editing={editingId !== null}
          busy={busy}
          error={err}
          onChange={setForm}
          onClose={() => setOpen(false)}
          onSave={save}
        />
      )}
    </Layout>
  );
}
