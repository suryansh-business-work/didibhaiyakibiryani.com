import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@apollo/client";
import { SLIDERS } from "../../graphql/queries";
import { CREATE_SLIDER, UPDATE_SLIDER, DELETE_SLIDER, DELETE_SLIDERS } from "../../graphql/mutations";
import { Box, Button, Typography } from "@mui/material";
import Layout from "../../components/Layout";
import { FormActions, Modal, OnOffChip } from "../../components/ui";
import { IPlus } from "../../components/icons";
import ImageUpload from "../../components/ImageUpload";
import { useAlert, useConfirm } from "../../components/dialog";
import { DataTable, useClientTable, type Column } from "../../components/DataTable";
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
  const [delMany] = useMutation(DELETE_SLIDERS);

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

  const columns = useMemo<Column<Slide>[]>(() => [
    {
      key: "imageUrl", label: "Image",
      render: (s) => <Box component="img" src={s.imageUrl} alt="" sx={{ width: 72, height: 48, borderRadius: 1.5, objectFit: "cover" }} />,
    },
    {
      key: "title", label: "Title", sortable: true,
      searchValue: (s) => `${s.title ?? ""} ${s.linkUrl ?? ""}`, sortValue: (s) => s.title ?? "",
      render: (s) => <Typography fontWeight={700}>{s.title || "—"}</Typography>,
    },
    {
      key: "linkUrl", label: "Link",
      searchValue: (s) => s.linkUrl ?? "",
      render: (s) => <Typography variant="body2" color="text.secondary">{s.linkUrl || "—"}</Typography>,
    },
    {
      key: "sortOrder", label: "Order", sortable: true, sortValue: (s) => s.sortOrder,
      render: (s) => <Typography variant="body2" color="text.secondary">{s.sortOrder}</Typography>,
    },
    { key: "isActive", label: "Status", render: (s) => <OnOffChip on={s.isActive} offLabel="Hidden" /> },
  ], []);

  const { tableProps } = useClientTable(slides, columns, { initialSortKey: "sortOrder", initialSortDir: "asc" });

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
    const ok = await confirm({ title: "Delete slide", message: `Delete this slide${s.title ? ` “${s.title}”` : ""}?`, confirmLabel: "Delete", danger: true });
    if (!ok) return;
    try {
      await del({ variables: { id: s.id } });
      await refetch();
    } catch (e: unknown) {
      await notify({ title: "Could not delete", message: e instanceof Error ? e.message : "Could not delete." });
    }
  }

  async function bulkDelete(ids: string[]) {
    const ok = await confirm({ title: "Delete slides", message: `Delete ${ids.length} selected slide(s)?`, confirmLabel: "Delete all", danger: true });
    if (!ok) return;
    try {
      await delMany({ variables: { ids } });
      await refetch();
    } catch (e: unknown) {
      await notify({ title: "Could not delete", message: e instanceof Error ? e.message : "Could not delete." });
    }
  }

  return (
    <Layout title="Slider">
      <DataTable
        columns={columns}
        rowKey={(s) => s.id}
        loading={loading && !data}
        emptyLabel="No slides yet."
        noun="slide"
        searchPlaceholder="Search slides…"
        onBulkDelete={bulkDelete}
        renderActions={(s) => (
          <>
            <Button size="small" onClick={() => openEdit(s)}>Edit</Button>
            <Button size="small" color="error" onClick={() => remove(s)}>Delete</Button>
          </>
        )}
        toolbarEnd={<Button variant="contained" startIcon={<IPlus size={16} />} onClick={openNew}>New slide</Button>}
        {...tableProps}
      />

      {open && (
        <Modal
          title={editing ? "Edit slide" : "New slide"}
          onClose={() => setOpen(false)}
          footer={<FormActions onCancel={() => setOpen(false)} onSave={handleSubmit(onSave)} busy={isSubmitting} />}
        >
          <ImageUpload
            folder="/slider"
            label="Slide image"
            cropAspect={16 / 9}
            currentUrl={watch("imageUrl")}
            onUploaded={(url) => setValue("imageUrl", url, { shouldValidate: true })}
          />
          {errors.imageUrl ? <Typography color="error" variant="caption" sx={{ display: "block" }}>{errors.imageUrl.message}</Typography> : null}
          <RHFField control={control} name="title" label="Title (optional)" error={errors.title?.message} />
          <RHFField control={control} name="subtitle" label="Subtitle (optional)" error={errors.subtitle?.message} />
          <RHFField control={control} name="linkUrl" label="Link URL (optional)" placeholder="https://…" error={errors.linkUrl?.message} />
          <RHFField control={control} name="sortOrder" label="Sort order" type="number" error={errors.sortOrder?.message} />
          <RHFCheckbox control={control} name="isActive" label="Active" />
          {errors.root ? <Typography color="error" variant="body2" sx={{ mt: 1 }}>{errors.root.message}</Typography> : null}
        </Modal>
      )}
    </Layout>
  );
}
