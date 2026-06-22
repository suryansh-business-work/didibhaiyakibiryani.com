import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { SLIDERS } from "../../graphql/queries";
import { CREATE_SLIDER, UPDATE_SLIDER, DELETE_SLIDER } from "../../graphql/mutations";
import Layout from "../../components/Layout";
import { AsyncList, Modal } from "../../components/ui";
import { IPlus } from "../../components/icons";
import ImageUpload from "../../components/ImageUpload";
import { useAlert, useConfirm } from "../../components/dialog";

interface Slide {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  linkUrl?: string;
  sortOrder: number;
  isActive: boolean;
}

const BLANK = { imageUrl: "", title: "", subtitle: "", linkUrl: "", sortOrder: 0, isActive: true };

export default function Slider() {
  const { data, loading, refetch } = useQuery<{ banners: Slide[] }>(SLIDERS);
  const [create] = useMutation(CREATE_SLIDER);
  const [update] = useMutation(UPDATE_SLIDER);
  const [del] = useMutation(DELETE_SLIDER);

  const confirm = useConfirm();
  const notify = useAlert();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Slide | null>(null);
  const [form, setForm] = useState({ ...BLANK });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const slides = data?.banners ?? [];

  function openNew() {
    setEditing(null);
    setForm({ ...BLANK });
    setErr("");
    setOpen(true);
  }
  function openEdit(s: Slide) {
    setEditing(s);
    setForm({
      imageUrl: s.imageUrl,
      title: s.title ?? "",
      subtitle: s.subtitle ?? "",
      linkUrl: s.linkUrl ?? "",
      sortOrder: s.sortOrder,
      isActive: s.isActive,
    });
    setErr("");
    setOpen(true);
  }

  async function save() {
    if (!form.imageUrl.trim()) {
      setErr("Please upload an image for the slide.");
      return;
    }
    setBusy(true);
    setErr("");
    const input = {
      imageUrl: form.imageUrl.trim(),
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      linkUrl: form.linkUrl.trim(),
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

  async function remove(s: Slide) {
    const ok = await confirm({
      title: "Delete slide",
      message: `Delete this slide${s.title ? ` “${s.title}”` : ""}?`,
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
    <Layout title="Slider">
      <div className="toolbar">
        <div className="spacer" />
        <button className="btn btn-gold" onClick={openNew}>
          <IPlus size={16} /> New slide
        </button>
      </div>

      <div className="card">
        <AsyncList loading={loading && !data} empty={slides.length === 0} emptyLabel="No slides yet.">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Link</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {slides.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <img src={s.imageUrl} alt="" className="upload-preview" />
                    </td>
                    <td className="t-strong">{s.title || "—"}</td>
                    <td className="muted">{s.linkUrl || "—"}</td>
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
          title={editing ? "Edit slide" : "New slide"}
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
          <ImageUpload
            folder="/slider"
            label="Slide image"
            currentUrl={form.imageUrl}
            onUploaded={(url) => setForm({ ...form, imageUrl: url })}
          />
          <div className="field">
            <label>Title (optional)</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="field">
            <label>Subtitle (optional)</label>
            <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          </div>
          <div className="field">
            <label>Link URL (optional)</label>
            <input value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} placeholder="https://…" />
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
