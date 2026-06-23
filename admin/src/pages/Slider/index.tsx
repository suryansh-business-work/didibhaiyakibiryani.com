import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@apollo/client";
import { SLIDERS } from "../../graphql/queries";
import { CREATE_SLIDER, UPDATE_SLIDER, DELETE_SLIDER } from "../../graphql/mutations";
import Layout from "../../components/Layout";
import { AsyncList, Modal } from "../../components/ui";
import { IPlus } from "../../components/icons";
import ImageUpload from "../../components/ImageUpload";
import { useAlert, useConfirm } from "../../components/dialog";
import { RHFField, RHFCheckbox, sliderSchema, type SliderForm } from "../../form";

interface Slide {
  id: string; imageUrl: string; title?: string; subtitle?: string;
  linkUrl?: string; sortOrder: number; isActive: boolean;
}
const BLANK: SliderForm = { imageUrl: "", title: "", subtitle: "", linkUrl: "", sortOrder: 0, isActive: true };

export default function Slider() {
  const { data, loading, refetch } = useQuery<{ banners: Slide[] }>(SLIDERS);
  const [create] = useMutation(CREATE_SLIDER);
  const [update] = useMutation(UPDATE_SLIDER);
  const [del] = useMutation(DELETE_SLIDER);

  const confirm = useConfirm();
  const notify = useAlert();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Slide | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SliderForm>({ resolver: zodResolver(sliderSchema), defaultValues: { ...BLANK } });

  const slides = data?.banners ?? [];

  function openNew() {
    setEditing(null);
    reset({ ...BLANK });
    setOpen(true);
  }
  function openEdit(s: Slide) {
    setEditing(s);
    reset({
      imageUrl: s.imageUrl,
      title: s.title ?? "",
      subtitle: s.subtitle ?? "",
      linkUrl: s.linkUrl ?? "",
      sortOrder: s.sortOrder,
      isActive: s.isActive,
    });
    setOpen(true);
  }

  async function onSave(form: SliderForm) {
    const input = {
      imageUrl: form.imageUrl.trim(),
      title: form.title?.trim(),
      subtitle: form.subtitle?.trim(),
      linkUrl: form.linkUrl?.trim(),
      sortOrder: form.sortOrder,
      isActive: form.isActive,
    };
    try {
      if (editing) await update({ variables: { id: editing.id, input } });
      else await create({ variables: { input } });
      setOpen(false);
      await refetch();
    } catch (e: unknown) {
      setError("root", { message: e instanceof Error ? e.message : "Could not save." });
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
      await notify({ title: "Could not delete", message: e instanceof Error ? e.message : "Could not delete." });
    }
  }

  return (
    <Layout title="Slider">
      <div className="toolbar">
        <div className="spacer" />
        <button className="btn btn-gold" onClick={openNew}><IPlus size={16} /> New slide</button>
      </div>

      <div className="card">
        <AsyncList loading={loading && !data} empty={slides.length === 0} emptyLabel="No slides yet.">
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Image</th><th>Title</th><th>Link</th><th>Order</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {slides.map((s) => (
                  <tr key={s.id}>
                    <td><img src={s.imageUrl} alt="" className="upload-preview" /></td>
                    <td className="t-strong">{s.title || "—"}</td>
                    <td className="muted">{s.linkUrl || "—"}</td>
                    <td className="muted">{s.sortOrder}</td>
                    <td>
                      <span className={`badge ${s.isActive ? "badge--green" : "badge--muted"}`}>
                        <span className="dot" />{s.isActive ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}>Edit</button>{" "}
                      <button className="btn btn-danger btn-sm" onClick={() => remove(s)}>Delete</button>
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
          footer={<>
            <button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-gold" onClick={handleSubmit(onSave)} disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save"}</button>
          </>}
        >
          <ImageUpload
            folder="/slider"
            label="Slide image"
            currentUrl={watch("imageUrl")}
            onUploaded={(url) => setValue("imageUrl", url, { shouldValidate: true })}
          />
          {errors.imageUrl ? <div className="field-error">{errors.imageUrl.message}</div> : null}
          <RHFField control={control} name="title" label="Title (optional)" error={errors.title?.message} />
          <RHFField control={control} name="subtitle" label="Subtitle (optional)" error={errors.subtitle?.message} />
          <RHFField control={control} name="linkUrl" label="Link URL (optional)" placeholder="https://…" error={errors.linkUrl?.message} />
          <RHFField control={control} name="sortOrder" label="Sort order" type="number" error={errors.sortOrder?.message} />
          <RHFCheckbox control={control} name="isActive" label="Active" />
          {errors.root && <div className="error-text">{errors.root.message}</div>}
        </Modal>
      )}
    </Layout>
  );
}
