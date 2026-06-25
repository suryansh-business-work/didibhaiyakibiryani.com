import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@apollo/client";
import { EXPENSES_PAGE, EXPENSE_SOURCES } from "../../graphql/queries";
import { CREATE_EXPENSE, UPDATE_EXPENSE, DELETE_EXPENSE, DELETE_EXPENSES } from "../../graphql/mutations";
import { Button, Chip, Link, Typography } from "@mui/material";
import Layout from "../../components/Layout";
import { FormActions, Modal, inr, fmtDate } from "../../components/ui";
import { IPlus } from "../../components/icons";
import { DataTable, useServerTable, type Column } from "../../components/DataTable";
import { useAlert, useConfirm } from "../../components/dialog";
import ImageUpload from "../../components/ImageUpload";
import { RHFField, RHFSelect, expenseSchema, type ExpenseForm } from "../../form";
import ExpenseDateField from "./ExpenseDateField";

interface SourceRef {
  id: string;
  type: "PERSON" | "ACCOUNT";
  name: string;
}
interface Expense {
  id: string;
  title: string;
  amount: number;
  note?: string;
  invoiceUrl?: string;
  date?: string;
  createdAt: string;
  source?: SourceRef | null;
}

const BLANK: ExpenseForm = { sourceId: "", title: "", amount: 0, note: "", invoiceUrl: "", date: new Date().toISOString() };

function sourceLabel(s: SourceRef): string {
  return `${s.name} — ${s.type === "PERSON" ? "Person" : "Account"}`;
}

export default function Expenses() {
  const { variables, tableProps } = useServerTable({ initialSortKey: "date", initialSortDir: "desc" });
  const { data, loading, refetch } = useQuery<{ expensesPage: { items: Expense[]; total: number } }>(EXPENSES_PAGE, { variables });
  const { data: srcData } = useQuery<{ expenseSources: SourceRef[] }>(EXPENSE_SOURCES);
  const [create] = useMutation(CREATE_EXPENSE);
  const [update] = useMutation(UPDATE_EXPENSE);
  const [del] = useMutation(DELETE_EXPENSE);
  const [delMany] = useMutation(DELETE_EXPENSES);

  const confirm = useConfirm();
  const notify = useAlert();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    setError,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseForm>({ resolver: zodResolver(expenseSchema), defaultValues: { ...BLANK } });

  const expenses = data?.expensesPage.items ?? [];
  const total = data?.expensesPage.total ?? 0;
  const sourceOptions = (srcData?.expenseSources ?? []).map((s) => ({ value: s.id, label: sourceLabel(s) }));

  const columns = useMemo<Column<Expense>[]>(() => [
    { key: "title", label: "Title", sortable: true, render: (e) => (
      <>
        <Typography fontWeight={700}>{e.title}</Typography>
        {e.invoiceUrl ? <Link href={e.invoiceUrl} target="_blank" rel="noreferrer" variant="caption">View invoice</Link> : null}
      </>
    ) },
    { key: "source", label: "Source", render: (e) => (e.source ? <Chip size="small" variant="outlined" label={sourceLabel(e.source)} /> : <Typography variant="body2" color="text.secondary">—</Typography>) },
    { key: "date", label: "Date", sortable: true, render: (e) => <Typography variant="body2" color="text.secondary">{fmtDate(e.date ?? e.createdAt)}</Typography> },
    { key: "amount", label: "Amount", align: "right", sortable: true, render: (e) => <Typography sx={{ fontVariantNumeric: "tabular-nums" }}>{inr(e.amount)}</Typography> },
  ], []);

  function openNew() {
    setEditing(null);
    reset({ ...BLANK });
    setOpen(true);
  }
  function openEdit(e: Expense) {
    setEditing(e);
    reset({ sourceId: e.source?.id ?? "", title: e.title, amount: e.amount, note: e.note ?? "", invoiceUrl: e.invoiceUrl ?? "", date: e.date ?? e.createdAt ?? "" });
    setOpen(true);
  }

  async function onSave(form: ExpenseForm) {
    const input = {
      sourceId: form.sourceId,
      title: form.title.trim(),
      amount: form.amount,
      note: form.note?.trim() || undefined,
      invoiceUrl: form.invoiceUrl?.trim() || undefined,
      date: form.date || undefined,
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

  async function remove(e: Expense) {
    const ok = await confirm({ title: "Delete expense", message: `Delete “${e.title}”?`, confirmLabel: "Delete", danger: true });
    if (!ok) return;
    try {
      await del({ variables: { id: e.id } });
      await refetch();
    } catch (err: unknown) {
      await notify({ title: "Could not delete", message: err instanceof Error ? err.message : "Could not delete." });
    }
  }

  async function bulkDelete(ids: string[]) {
    const ok = await confirm({ title: "Delete expenses", message: `Delete ${ids.length} selected expense(s)?`, confirmLabel: "Delete all", danger: true });
    if (!ok) return;
    try {
      await delMany({ variables: { ids } });
      await refetch();
    } catch (err: unknown) {
      await notify({ title: "Could not delete", message: err instanceof Error ? err.message : "Could not delete." });
    }
  }

  return (
    <Layout title="Manage Expenses">
      <DataTable
        columns={columns}
        rows={expenses}
        total={total}
        rowKey={(e) => e.id}
        loading={loading && !data}
        emptyLabel="No expenses yet."
        noun="expense"
        searchPlaceholder="Search expense title…"
        onBulkDelete={bulkDelete}
        renderActions={(e) => (
          <>
            <Button size="small" onClick={() => openEdit(e)}>Edit</Button>
            <Button size="small" color="error" onClick={() => remove(e)}>Delete</Button>
          </>
        )}
        toolbarEnd={<Button variant="contained" startIcon={<IPlus size={16} />} onClick={openNew}>New expense</Button>}
        {...tableProps}
      />

      {open && (
        <Modal
          title={editing ? "Edit expense" : "New expense"}
          onClose={() => setOpen(false)}
          footer={<FormActions onCancel={() => setOpen(false)} onSave={handleSubmit(onSave)} busy={isSubmitting} />}
        >
          <RHFSelect control={control} name="sourceId" label="Expense source" options={sourceOptions} error={errors.sourceId?.message} emptyLabel="Select a source" />
          <RHFField control={control} name="title" label="Title" placeholder="e.g. Vegetables, Rent" error={errors.title?.message} />
          <RHFField control={control} name="amount" label="Amount (₹)" type="number" error={errors.amount?.message} />
          <ExpenseDateField control={control} />
          <RHFField control={control} name="note" label="Note (optional)" multiline error={errors.note?.message} />
          <ImageUpload
            folder="/expenses"
            label="Invoice (optional)"
            accept="image/*,application/pdf"
            currentUrl={watch("invoiceUrl")}
            onUploaded={(url) => setValue("invoiceUrl", url, { shouldValidate: true })}
          />
          {errors.root ? <Typography color="error" variant="body2" sx={{ mt: 1 }}>{errors.root.message}</Typography> : null}
        </Modal>
      )}
    </Layout>
  );
}
