import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@apollo/client";
import { EXPENSES, EXPENSE_SOURCES } from "../../graphql/queries";
import { CREATE_EXPENSE, UPDATE_EXPENSE, DELETE_EXPENSE } from "../../graphql/mutations";
import { Box, Button, Chip, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import Layout from "../../components/Layout";
import { AsyncList, FormActions, Modal, inr, fmtDate } from "../../components/ui";
import { IPlus } from "../../components/icons";
import { useAlert, useConfirm } from "../../components/dialog";
import { RHFField, RHFSelect, expenseSchema, type ExpenseForm } from "../../form";

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
  createdAt: string;
  source?: SourceRef | null;
}

const BLANK: ExpenseForm = { sourceId: "", title: "", amount: 0, note: "" };

function sourceLabel(s: SourceRef): string {
  return `${s.name} — ${s.type === "PERSON" ? "Person" : "Account"}`;
}

export default function Expenses() {
  const { data, loading, refetch } = useQuery<{ expenses: Expense[] }>(EXPENSES);
  const { data: srcData } = useQuery<{ expenseSources: SourceRef[] }>(EXPENSE_SOURCES);
  const [create] = useMutation(CREATE_EXPENSE);
  const [update] = useMutation(UPDATE_EXPENSE);
  const [del] = useMutation(DELETE_EXPENSE);

  const confirm = useConfirm();
  const notify = useAlert();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseForm>({ resolver: zodResolver(expenseSchema), defaultValues: { ...BLANK } });

  const expenses = data?.expenses ?? [];
  const sourceOptions = (srcData?.expenseSources ?? []).map((s) => ({ value: s.id, label: sourceLabel(s) }));

  function openNew() {
    setEditing(null);
    reset({ ...BLANK });
    setOpen(true);
  }
  function openEdit(e: Expense) {
    setEditing(e);
    reset({ sourceId: e.source?.id ?? "", title: e.title, amount: e.amount, note: e.note ?? "" });
    setOpen(true);
  }

  async function onSave(form: ExpenseForm) {
    const input = {
      sourceId: form.sourceId,
      title: form.title.trim(),
      amount: form.amount,
      note: form.note?.trim() || undefined,
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
    const ok = await confirm({
      title: "Delete expense",
      message: `Delete “${e.title}”?`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await del({ variables: { id: e.id } });
      await refetch();
    } catch (err: unknown) {
      await notify({ title: "Could not delete", message: err instanceof Error ? err.message : "Could not delete." });
    }
  }

  return (
    <Layout title="Manage Expenses">
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button variant="contained" startIcon={<IPlus size={16} />} onClick={openNew}>New expense</Button>
      </Box>

      <div className="card">
        <AsyncList loading={loading && !data} empty={expenses.length === 0} emptyLabel="No expenses yet.">
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell><TableCell>Source</TableCell><TableCell>Date</TableCell>
                  <TableCell align="right">Amount</TableCell><TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {expenses.map((e) => (
                  <TableRow key={e.id} hover>
                    <TableCell><Typography fontWeight={700}>{e.title}</Typography></TableCell>
                    <TableCell>
                      {e.source ? (
                        <Chip size="small" variant="outlined" label={sourceLabel(e.source)} />
                      ) : (
                        <Typography variant="body2" color="text.secondary">—</Typography>
                      )}
                    </TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{fmtDate(e.createdAt)}</Typography></TableCell>
                    <TableCell align="right"><Typography sx={{ fontVariantNumeric: "tabular-nums" }}>{inr(e.amount)}</Typography></TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      <Button size="small" onClick={() => openEdit(e)}>Edit</Button>
                      <Button size="small" color="error" onClick={() => remove(e)}>Delete</Button>
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
          title={editing ? "Edit expense" : "New expense"}
          onClose={() => setOpen(false)}
          footer={<FormActions onCancel={() => setOpen(false)} onSave={handleSubmit(onSave)} busy={isSubmitting} />}
        >
          <RHFSelect control={control} name="sourceId" label="Expense source" options={sourceOptions} error={errors.sourceId?.message} emptyLabel="Select a source" />
          <RHFField control={control} name="title" label="Title" placeholder="e.g. Vegetables, Rent" error={errors.title?.message} />
          <RHFField control={control} name="amount" label="Amount (₹)" type="number" error={errors.amount?.message} />
          <RHFField control={control} name="note" label="Note (optional)" multiline error={errors.note?.message} />
          {errors.root ? <Typography color="error" variant="body2" sx={{ mt: 1 }}>{errors.root.message}</Typography> : null}
        </Modal>
      )}
    </Layout>
  );
}
