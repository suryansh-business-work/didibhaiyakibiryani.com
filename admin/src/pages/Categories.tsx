import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@apollo/client";
import { CATEGORIES } from "../graphql/queries";
import { CREATE_CATEGORY, UPDATE_CATEGORY, DELETE_CATEGORY } from "../graphql/mutations";
import { Box, Button, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import Layout from "../components/Layout";
import { AsyncList, FormActions, Modal, OnOffChip } from "../components/ui";
import { IPlus } from "../components/icons";
import { useAlert, useConfirm } from "../components/dialog";
import { RHFField, RHFCheckbox, categorySchema, type CategoryForm } from "../form";

interface Cat {
  id: string; name: string; description?: string; sortOrder: number;
  isActive: boolean; itemCount: number;
}
const BLANK: CategoryForm = { name: "", description: "", sortOrder: 0, isActive: true };

export default function Categories() {
  const { data, loading, refetch } = useQuery<{ categories: Cat[] }>(CATEGORIES);
  const [create] = useMutation(CREATE_CATEGORY);
  const [update] = useMutation(UPDATE_CATEGORY);
  const [del] = useMutation(DELETE_CATEGORY);

  const confirm = useConfirm();
  const notify = useAlert();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cat | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CategoryForm>({ resolver: zodResolver(categorySchema), defaultValues: { ...BLANK } });

  const cats = data?.categories ?? [];

  function openNew() {
    setEditing(null);
    reset({ ...BLANK });
    setOpen(true);
  }
  function openEdit(c: Cat) {
    setEditing(c);
    reset({ name: c.name, description: c.description ?? "", sortOrder: c.sortOrder, isActive: c.isActive });
    setOpen(true);
  }

  async function onSave(form: CategoryForm) {
    const input = { name: form.name.trim(), description: form.description, sortOrder: form.sortOrder, isActive: form.isActive };
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
      await notify({ title: "Could not delete", message: e instanceof Error ? e.message : "Could not delete." });
    }
  }

  return (
    <Layout title="Categories">
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button variant="contained" startIcon={<IPlus size={16} />} onClick={openNew}>New category</Button>
      </Box>

      <div className="card">
        <AsyncList loading={loading && !data} empty={cats.length === 0} emptyLabel="No categories yet.">
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell><TableCell>Description</TableCell><TableCell>Items</TableCell>
                  <TableCell>Order</TableCell><TableCell>Status</TableCell><TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {cats.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell><Typography fontWeight={700}>{c.name}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{c.description || "—"}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{c.itemCount}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{c.sortOrder}</Typography></TableCell>
                    <TableCell><OnOffChip on={c.isActive} offLabel="Hidden" /></TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      <Button size="small" onClick={() => openEdit(c)}>Edit</Button>
                      <Button size="small" color="error" onClick={() => remove(c)}>Delete</Button>
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
          title={editing ? "Edit category" : "New category"}
          onClose={() => setOpen(false)}
          footer={<FormActions onCancel={() => setOpen(false)} onSave={handleSubmit(onSave)} busy={isSubmitting} />}
        >
          <RHFField control={control} name="name" label="Name" error={errors.name?.message} />
          <RHFField control={control} name="description" label="Description" error={errors.description?.message} />
          <RHFField control={control} name="sortOrder" label="Sort order" type="number" error={errors.sortOrder?.message} />
          <RHFCheckbox control={control} name="isActive" label="Active" />
          {errors.root ? <Typography color="error" variant="body2" sx={{ mt: 1 }}>{errors.root.message}</Typography> : null}
        </Modal>
      )}
    </Layout>
  );
}
