import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@apollo/client";
import { SLIDERS } from "../../graphql/queries";
import { CREATE_SLIDER, UPDATE_SLIDER, DELETE_SLIDER } from "../../graphql/mutations";
import { Box, Button, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import Layout from "../../components/Layout";
import { AsyncList, FormActions, Modal, OnOffChip } from "../../components/ui";
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
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button variant="contained" startIcon={<IPlus size={16} />} onClick={openNew}>New slide</Button>
      </Box>

      <div className="card">
        <AsyncList loading={loading && !data} empty={slides.length === 0} emptyLabel="No slides yet.">
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Image</TableCell><TableCell>Title</TableCell><TableCell>Link</TableCell>
                  <TableCell>Order</TableCell><TableCell>Status</TableCell><TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {slides.map((s) => (
                  <TableRow key={s.id} hover>
                    <TableCell><Box component="img" src={s.imageUrl} alt="" sx={{ width: 72, height: 48, borderRadius: 1.5, objectFit: "cover" }} /></TableCell>
                    <TableCell><Typography fontWeight={700}>{s.title || "—"}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{s.linkUrl || "—"}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{s.sortOrder}</Typography></TableCell>
                    <TableCell><OnOffChip on={s.isActive} offLabel="Hidden" /></TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      <Button size="small" onClick={() => openEdit(s)}>Edit</Button>
                      <Button size="small" color="error" onClick={() => remove(s)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </AsyncList>
      </div>

      {open && (
        <Modal
          title={editing ? "Edit slide" : "New slide"}
          onClose={() => setOpen(false)}
          footer={<FormActions onCancel={() => setOpen(false)} onSave={handleSubmit(onSave)} busy={isSubmitting} />}
        >
          <ImageUpload
            folder="/slider"
            label="Slide image"
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
