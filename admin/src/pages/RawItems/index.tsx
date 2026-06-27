import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@apollo/client";
import { Button, Stack, Typography } from "@mui/material";
import { EXPENSE_PRODUCTS } from "../../graphql/queries";
import { CREATE_EXPENSE_PRODUCT, UPDATE_EXPENSE_PRODUCT, DELETE_EXPENSE_PRODUCT } from "../../graphql/mutations";
import Layout from "../../components/Layout";
import { FormActions, Modal, inr } from "../../components/ui";
import { IPlus } from "../../components/icons";
import { DataTable, useClientTable, type Column } from "../../components/DataTable";
import { useAlert, useConfirm } from "../../components/dialog";
import ExportButtons from "../../components/ExportButtons";
import { RHFField, RHFSelect, rawItemSchema, type RawItemForm } from "../../form";

const PRICE_UNITS = ["KG", "Gram", "Litre", "Piece", "Dozen", "Packet", "Quantity"];
const UNIT_OPTIONS = PRICE_UNITS.map((u) => ({ value: u, label: u }));

interface RawItem { id: string; name: string; marketPrice: number; priceUnit?: string }

const BLANK: RawItemForm = { name: "", marketPrice: 0, priceUnit: "" };

/** Catalogue of raw materials (name + reference market price + unit). Expenses
 *  are recorded against these under Manage Expenses. */
export default function RawItems() {
  const { data, loading, refetch } = useQuery<{ expenseProducts: RawItem[] }>(EXPENSE_PRODUCTS);
  const [create] = useMutation(CREATE_EXPENSE_PRODUCT);
  const [update] = useMutation(UPDATE_EXPENSE_PRODUCT);
  const [del] = useMutation(DELETE_EXPENSE_PRODUCT);
  const confirm = useConfirm();
  const notify = useAlert();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RawItem | null>(null);
  const { control, handleSubmit, reset, setError, formState: { errors, isSubmitting } } =
    useForm<RawItemForm>({ resolver: zodResolver(rawItemSchema), defaultValues: { ...BLANK } });

  const items = data?.expenseProducts ?? [];

  const columns = useMemo<Column<RawItem>[]>(() => [
    { key: "name", label: "Name", sortable: true, searchValue: (i) => i.name, sortValue: (i) => i.name, render: (i) => <Typography fontWeight={700}>{i.name}</Typography> },
    { key: "marketPrice", label: "Market price", align: "right", sortable: true, sortValue: (i) => i.marketPrice, render: (i) => <Typography sx={{ fontVariantNumeric: "tabular-nums" }}>{inr(i.marketPrice)}</Typography> },
    { key: "priceUnit", label: "Unit", render: (i) => <Typography variant="body2" color="text.secondary">{i.priceUnit ?? "—"}</Typography> },
  ], []);

  const { tableProps } = useClientTable(items, columns, { initialSortKey: "name", initialSortDir: "asc" });

  function openNew() { setEditing(null); reset({ ...BLANK }); setOpen(true); }
  function openEdit(i: RawItem) { setEditing(i); reset({ name: i.name, marketPrice: i.marketPrice, priceUnit: i.priceUnit ?? "" }); setOpen(true); }

  async function onSave(form: RawItemForm) {
    const vars = { name: form.name.trim(), marketPrice: form.marketPrice, priceUnit: form.priceUnit?.trim() || null };
    try {
      if (editing) await update({ variables: { id: editing.id, ...vars } });
      else await create({ variables: vars });
      setOpen(false);
      await refetch();
    } catch (e: unknown) {
      setError("root", { message: e instanceof Error ? e.message : "Could not save." });
    }
  }

  async function remove(i: RawItem) {
    const ok = await confirm({ title: "Delete raw item", message: `Delete “${i.name}”? Expenses recorded against it are also removed.`, confirmLabel: "Delete", danger: true });
    if (!ok) return;
    try { await del({ variables: { id: i.id } }); await refetch(); }
    catch (e: unknown) { await notify({ title: "Could not delete", message: e instanceof Error ? e.message : "Could not delete." }); }
  }

  return (
    <Layout title="Raw Items">
      <DataTable
        columns={columns}
        rowKey={(i) => i.id}
        loading={loading && !data}
        emptyLabel="No raw items yet."
        noun="raw item"
        searchPlaceholder="Search raw items…"
        renderActions={(i) => (
          <>
            <Button size="small" onClick={() => openEdit(i)}>Edit</Button>
            <Button size="small" color="error" onClick={() => remove(i)}>Delete</Button>
          </>
        )}
        toolbarEnd={
          <Stack direction="row" spacing={1} alignItems="center">
            <ExportButtons report="raw-items" />
            <Button variant="contained" startIcon={<IPlus size={16} />} onClick={openNew}>New raw item</Button>
          </Stack>
        }
        {...tableProps}
      />

      {open && (
        <Modal
          title={editing ? "Edit raw item" : "New raw item"}
          onClose={() => setOpen(false)}
          footer={<FormActions onCancel={() => setOpen(false)} onSave={handleSubmit(onSave)} busy={isSubmitting} />}
        >
          <RHFField control={control} name="name" label="Name" placeholder="e.g. Rice, Chicken, Gas" error={errors.name?.message} />
          <RHFField control={control} name="marketPrice" label="Market price (₹)" type="number" error={errors.marketPrice?.message} />
          <RHFSelect control={control} name="priceUnit" label="Unit (optional)" options={UNIT_OPTIONS} emptyLabel="No unit" error={errors.priceUnit?.message} />
          {errors.root ? <Typography color="error" variant="body2" sx={{ mt: 1 }}>{errors.root.message}</Typography> : null}
        </Modal>
      )}
    </Layout>
  );
}
