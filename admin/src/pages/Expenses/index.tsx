import { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@apollo/client";
import { Autocomplete, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { startOfDay, endOfDay } from "date-fns";
import { EXPENSES_PAGE, EXPENSE_SOURCES, EXPENSE_PRODUCTS } from "../../graphql/queries";
import { CREATE_EXPENSE, UPDATE_EXPENSE, DELETE_EXPENSE, DELETE_EXPENSES } from "../../graphql/mutations";
import Layout from "../../components/Layout";
import { FormActions, Modal, inr, fmtDate } from "../../components/ui";
import { IPlus } from "../../components/icons";
import { DataTable, useServerTable, type Column } from "../../components/DataTable";
import { useAlert, useConfirm } from "../../components/dialog";
import ExportButtons from "../../components/ExportButtons";
import { RHFField, RHFSelect, expenseSchema, type ExpenseForm } from "../../form";

interface SourceRef { id: string; name: string; color?: string | null }
interface ProductRef { id: string; name: string; priceUnit?: string | null }
interface Expense {
  id: string; title: string; amount: number; unit?: string; note?: string;
  date?: string; createdAt: string; source?: SourceRef | null; product?: ProductRef | null;
}

const BLANK: ExpenseForm = { sourceId: "", productId: "", amount: 0, unit: "", note: "", date: new Date().toISOString() };

export default function Expenses() {
  const { variables, tableProps, setPage } = useServerTable({ initialSortKey: "date", initialSortDir: "desc" });
  const [sourceId, setSourceId] = useState("");
  const [productId, setProductId] = useState("");
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const filterVars = {
    sourceId: sourceId || null,
    productId: productId || null,
    from: fromDate ? startOfDay(fromDate).toISOString() : null,
    to: toDate ? endOfDay(toDate).toISOString() : null,
  };
  const filtered = Boolean(sourceId || productId || fromDate || toDate);
  const { data, loading, refetch } = useQuery<{ expensesPage: { items: Expense[]; total: number } }>(EXPENSES_PAGE, { variables: { ...variables, ...filterVars } });
  const { data: srcData } = useQuery<{ expenseSources: SourceRef[] }>(EXPENSE_SOURCES);
  const { data: prodData } = useQuery<{ expenseProducts: ProductRef[] }>(EXPENSE_PRODUCTS);
  const [create] = useMutation(CREATE_EXPENSE);
  const [update] = useMutation(UPDATE_EXPENSE);
  const [del] = useMutation(DELETE_EXPENSE);
  const [delMany] = useMutation(DELETE_EXPENSES);
  const confirm = useConfirm();
  const notify = useAlert();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const { control, handleSubmit, reset, setError, formState: { errors, isSubmitting } } =
    useForm<ExpenseForm>({ resolver: zodResolver(expenseSchema), defaultValues: { ...BLANK } });

  const expenses = data?.expensesPage.items ?? [];
  const total = data?.expensesPage.total ?? 0;
  const products = prodData?.expenseProducts ?? [];
  const sourceOptions = (srcData?.expenseSources ?? []).map((s) => ({ value: s.id, label: s.name }));
  const productOptions = products.map((p) => ({ value: p.id, label: p.name }));

  const columns = useMemo<Column<Expense>[]>(() => [
    { key: "source", label: "Expense from", render: (e) => <Typography variant="body2" color="text.secondary">{e.source?.name ?? "—"}</Typography> },
    { key: "title", label: "Raw item", sortable: true, render: (e) => <Typography fontWeight={700}>{e.product?.name ?? e.title}</Typography> },
    { key: "amount", label: "Amount", align: "right", sortable: true, render: (e) => <Typography sx={{ fontVariantNumeric: "tabular-nums" }}>{inr(e.amount)}</Typography> },
    { key: "unit", label: "Unit", render: (e) => <Typography variant="body2" color="text.secondary">{e.unit ?? "—"}</Typography> },
    { key: "date", label: "Date", sortable: true, render: (e) => <Typography variant="body2" color="text.secondary">{fmtDate(e.date ?? e.createdAt)}</Typography> },
  ], []);

  function openNew() {
    setEditing(null);
    reset({ ...BLANK, date: new Date().toISOString() });
    setOpen(true);
  }
  function openEdit(e: Expense) {
    setEditing(e);
    reset({ sourceId: e.source?.id ?? "", productId: e.product?.id ?? "", amount: e.amount, unit: e.unit ?? "", note: e.note ?? "", date: e.date ?? e.createdAt ?? "" });
    setOpen(true);
  }

  async function onSave(form: ExpenseForm) {
    const product = products.find((p) => p.id === form.productId);
    const input = {
      sourceId: form.sourceId || undefined,
      productId: form.productId,
      title: product?.name ?? "Expense",
      amount: form.amount,
      unit: form.unit?.trim() || product?.priceUnit || undefined,
      note: form.note?.trim() || undefined,
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
    const ok = await confirm({ title: "Delete expense", message: `Delete “${e.product?.name ?? e.title}”?`, confirmLabel: "Delete", danger: true });
    if (!ok) return;
    try { await del({ variables: { id: e.id } }); await refetch(); }
    catch (err: unknown) { await notify({ title: "Could not delete", message: err instanceof Error ? err.message : "Could not delete." }); }
  }

  async function bulkDelete(ids: string[]) {
    const ok = await confirm({ title: "Delete expenses", message: `Delete ${ids.length} selected expense(s)?`, confirmLabel: "Delete all", danger: true });
    if (!ok) return;
    try { await delMany({ variables: { ids } }); await refetch(); }
    catch (err: unknown) { await notify({ title: "Could not delete", message: err instanceof Error ? err.message : "Could not delete." }); }
  }

  function clearFilters() {
    setSourceId("");
    setProductId("");
    setFromDate(null);
    setToDate(null);
    setPage(1);
  }

  return (
    <Layout title="Manage Expenses">
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2 }}>
        <Autocomplete
          size="small"
          sx={{ minWidth: 190 }}
          options={sourceOptions}
          getOptionLabel={(o) => o.label}
          isOptionEqualToValue={(o, v) => o.value === v.value}
          value={sourceOptions.find((o) => o.value === sourceId) ?? null}
          onChange={(_, opt) => { setSourceId(opt ? opt.value : ""); setPage(1); }}
          renderInput={(params) => <TextField {...params} label="Expense from" placeholder="All sources" />}
        />
        <Autocomplete
          size="small"
          sx={{ minWidth: 190 }}
          options={productOptions}
          getOptionLabel={(o) => o.label}
          isOptionEqualToValue={(o, v) => o.value === v.value}
          value={productOptions.find((o) => o.value === productId) ?? null}
          onChange={(_, opt) => { setProductId(opt ? opt.value : ""); setPage(1); }}
          renderInput={(params) => <TextField {...params} label="Raw item" placeholder="All raw items" />}
        />
        <DatePicker label="From" value={fromDate} onChange={(d) => { setFromDate(d); setPage(1); }} slotProps={{ textField: { size: "small" } }} />
        <DatePicker label="To" value={toDate} onChange={(d) => { setToDate(d); setPage(1); }} slotProps={{ textField: { size: "small" } }} />
        {filtered ? <Button color="inherit" onClick={clearFilters}>Clear filters</Button> : null}
      </Box>

      <DataTable
        columns={columns}
        rows={expenses}
        total={total}
        rowKey={(e) => e.id}
        loading={loading && !data}
        emptyLabel="No expenses yet."
        noun="expense"
        searchPlaceholder="Search raw item…"
        onBulkDelete={bulkDelete}
        renderActions={(e) => (
          <>
            <Button size="small" onClick={() => openEdit(e)}>Edit</Button>
            <Button size="small" color="error" onClick={() => remove(e)}>Delete</Button>
          </>
        )}
        toolbarEnd={
          <Stack direction="row" spacing={1} alignItems="center">
            <ExportButtons report="expenses" params={{ sourceId, productId, from: filterVars.from, to: filterVars.to, search: tableProps.search }} />
            <Button variant="contained" startIcon={<IPlus size={16} />} onClick={openNew}>New expense</Button>
          </Stack>
        }
        {...tableProps}
      />

      {open && (
        <Modal
          title={editing ? "Edit expense" : "New expense"}
          onClose={() => setOpen(false)}
          footer={<FormActions onCancel={() => setOpen(false)} onSave={handleSubmit(onSave)} busy={isSubmitting} />}
        >
          <RHFSelect control={control} name="sourceId" label="Expense from" options={sourceOptions} error={errors.sourceId?.message} emptyLabel="No source" />
          <RHFSelect control={control} name="productId" label="Raw item" options={productOptions} error={errors.productId?.message} emptyLabel="Select a raw item" />
          <RHFField control={control} name="amount" label="Amount (₹)" type="number" error={errors.amount?.message} />
          <RHFField control={control} name="unit" label="Unit (optional)" error={errors.unit?.message} />
          <Controller
            control={control}
            name="date"
            render={({ field }) => (
              <DatePicker
                label="Date"
                value={field.value ? new Date(field.value) : null}
                onChange={(d) => field.onChange(d instanceof Date && !Number.isNaN(d.getTime()) ? d.toISOString() : "")}
                slotProps={{ textField: { size: "small", fullWidth: true, margin: "dense" } }}
              />
            )}
          />
          <RHFField control={control} name="note" label="Note (optional)" multiline error={errors.note?.message} />
          {errors.root ? <Box sx={{ mt: 1 }}><Typography color="error" variant="body2">{errors.root.message}</Typography></Box> : null}
        </Modal>
      )}
    </Layout>
  );
}
