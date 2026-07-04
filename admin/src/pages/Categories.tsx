import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@apollo/client";
import { CATEGORIES, SETTINGS } from "../graphql/queries";
import { CREATE_CATEGORY, UPDATE_CATEGORY, DELETE_CATEGORY, DELETE_CATEGORIES, UPDATE_SETTINGS } from "../graphql/mutations";
import { Box, Button, Typography } from "@mui/material";
import Layout from "../components/Layout";
import { FormActions, Modal, OnOffChip } from "../components/ui";
import { IPlus } from "../components/icons";
import { DataTable, useClientTable, type Column } from "../components/DataTable";
import { useAlert, useConfirm } from "../components/dialog";
import ImageUpload from "../components/ImageUpload";
import { RHFField, RHFCheckbox, categorySchema, type CategoryForm } from "../form";

interface Cat {
  id: string; name: string; description?: string; image?: string; sortOrder: number;
  isActive: boolean; itemCount: number;
}
const BLANK: CategoryForm = { name: "", description: "", image: "", sortOrder: 0, isActive: true };

export default function Categories() {
  const { data, loading, refetch } = useQuery<{ categories: Cat[] }>(CATEGORIES);
  const [create] = useMutation(CREATE_CATEGORY);
  const [update] = useMutation(UPDATE_CATEGORY);
  const [del] = useMutation(DELETE_CATEGORY);
  const [delMany] = useMutation(DELETE_CATEGORIES);
  const { data: sData, refetch: refetchSettings } = useQuery<{ settings: { allCategoryImage?: string } }>(SETTINGS);
  const [saveSettings] = useMutation(UPDATE_SETTINGS);

  const confirm = useConfirm();
  const notify = useAlert();

  async function onAllImage(url: string) {
    try {
      await saveSettings({ variables: { input: { allCategoryImage: url } } });
      await refetchSettings();
      await notify({ title: "Saved", message: "“All” category icon updated." });
    } catch (e: unknown) {
      await notify({ title: "Could not save", message: e instanceof Error ? e.message : "Please try again." });
    }
  }

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cat | null>(null);
  const {
    control, handleSubmit, reset, setError, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<CategoryForm>({ resolver: zodResolver(categorySchema), defaultValues: { ...BLANK } });

  const cats = data?.categories ?? [];

  const columns = useMemo<Column<Cat>[]>(() => [
    { key: "image", label: "Icon", render: (c) => (c.image ? <img src={c.image} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover", display: "block" }} /> : <Typography variant="body2" color="text.secondary">—</Typography>) },
    { key: "name", label: "Name", sortable: true, searchValue: (c) => c.name, sortValue: (c) => c.name, render: (c) => <Typography fontWeight={700}>{c.name}</Typography> },
    { key: "description", label: "Description", searchValue: (c) => c.description ?? "", render: (c) => <Typography variant="body2" color="text.secondary">{c.description || "—"}</Typography> },
    { key: "itemCount", label: "Items", sortable: true, sortValue: (c) => c.itemCount, render: (c) => <Typography variant="body2" color="text.secondary">{c.itemCount}</Typography> },
    { key: "sortOrder", label: "Order", sortable: true, sortValue: (c) => c.sortOrder, render: (c) => <Typography variant="body2" color="text.secondary">{c.sortOrder}</Typography> },
    { key: "isActive", label: "Status", render: (c) => <OnOffChip on={c.isActive} offLabel="Hidden" /> },
  ], []);

  const { tableProps } = useClientTable(cats, columns, { initialSortKey: "sortOrder", initialSortDir: "asc" });

  function openNew() {
    setEditing(null);
    reset({ ...BLANK });
    setOpen(true);
  }
  function openEdit(c: Cat) {
    setEditing(c);
    reset({ name: c.name, description: c.description ?? "", image: c.image ?? "", sortOrder: c.sortOrder, isActive: c.isActive });
    setOpen(true);
  }

  async function onSave(form: CategoryForm) {
    const input = { name: form.name.trim(), description: form.description, image: form.image?.trim() || null, sortOrder: form.sortOrder, isActive: form.isActive };
    try {
      if (editing) await update({ variables: { id: editing.id, input } });
      else await create({ variables: { input } });
      setOpen(false);
      await refetch();
    } catch (e: unknown) {
      setError("root", { message: e instanceof Error ? e.message : "Could not save." });
    }
  }

  async function remove(c: Cat) {
    const ok = await confirm({ title: "Delete category", message: `Delete category “${c.name}”?`, confirmLabel: "Delete", danger: true });
    if (!ok) return;
    try {
      await del({ variables: { id: c.id } });
      await refetch();
    } catch (e: unknown) {
      await notify({ title: "Could not delete", message: e instanceof Error ? e.message : "Could not delete." });
    }
  }

  async function bulkDelete(ids: string[]) {
    const ok = await confirm({ title: "Delete categories", message: `Delete ${ids.length} selected categor(ies)?`, confirmLabel: "Delete all", danger: true });
    if (!ok) return;
    try {
      await delMany({ variables: { ids } });
      await refetch();
    } catch (e: unknown) {
      await notify({ title: "Could not delete", message: e instanceof Error ? e.message : "Could not delete." });
    }
  }

  return (
    <Layout title="Categories">
      <Box sx={{ mb: 2, p: 2.5, border: 1, borderColor: "divider", borderRadius: 2, bgcolor: "background.paper" }}>
        <Typography fontWeight={700}>“All” category tile</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Icon for the “All” chip that appears first in the app’s “What are you craving for?” row.
        </Typography>
        <ImageUpload label="All icon" folder="/categories" cropAspect={1} currentUrl={sData?.settings?.allCategoryImage} onUploaded={onAllImage} />
      </Box>

      <DataTable
        columns={columns}
        rowKey={(c) => c.id}
        loading={loading && !data}
        emptyLabel="No categories yet."
        noun="category"
        searchPlaceholder="Search categories…"
        onBulkDelete={bulkDelete}
        renderActions={(c) => (
          <>
            <Button size="small" onClick={() => openEdit(c)}>Edit</Button>
            <Button size="small" color="error" onClick={() => remove(c)}>Delete</Button>
          </>
        )}
        toolbarEnd={<Button variant="contained" startIcon={<IPlus size={16} />} onClick={openNew}>New category</Button>}
        {...tableProps}
      />

      {open && (
        <Modal
          title={editing ? "Edit category" : "New category"}
          onClose={() => setOpen(false)}
          footer={<FormActions onCancel={() => setOpen(false)} onSave={handleSubmit(onSave)} busy={isSubmitting} />}
        >
          <RHFField control={control} name="name" label="Name" error={errors.name?.message} />
          <RHFField control={control} name="description" label="Description" error={errors.description?.message} />
          <ImageUpload label="Category icon" folder="/categories" cropAspect={1} currentUrl={watch("image")} onUploaded={(url) => setValue("image", url)} />
          <RHFField control={control} name="sortOrder" label="Sort order" type="number" error={errors.sortOrder?.message} />
          <RHFCheckbox control={control} name="isActive" label="Active" />
          {errors.root ? <Typography color="error" variant="body2" sx={{ mt: 1 }}>{errors.root.message}</Typography> : null}
        </Modal>
      )}
    </Layout>
  );
}
