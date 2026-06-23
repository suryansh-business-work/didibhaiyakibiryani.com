import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@apollo/client";
import { EXPENSE_SOURCES } from "../../graphql/queries";
import {
  CREATE_EXPENSE_SOURCE,
  UPDATE_EXPENSE_SOURCE,
  DELETE_EXPENSE_SOURCE,
} from "../../graphql/mutations";
import { Box, Button, Chip, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import Layout from "../../components/Layout";
import { AsyncList, FormActions, Modal, OnOffChip } from "../../components/ui";
import { IPlus } from "../../components/icons";
import { useAlert, useConfirm } from "../../components/dialog";
import { RHFField, RHFSelect, RHFCheckbox, expenseSourceSchema, type ExpenseSourceForm } from "../../form";

interface ExpenseSource {
  id: string;
  type: "PERSON" | "ACCOUNT";
  name: string;
  phone?: string;
  email?: string;
  bankName?: string;
  accountNumber?: string;
  ifsc?: string;
  note?: string;
  isActive: boolean;
}

const TYPE_OPTIONS = [
  { value: "PERSON", label: "From Person" },
  { value: "ACCOUNT", label: "From Account" },
];

const BLANK: ExpenseSourceForm = {
  type: "PERSON", name: "", phone: "", email: "", bankName: "", accountNumber: "", ifsc: "", note: "", isActive: true,
};

function detailOf(s: ExpenseSource): string {
  if (s.type === "PERSON") return s.phone || "—";
  return [s.bankName, s.accountNumber].filter(Boolean).join(" • ") || "—";
}

export default function ExpenseSources() {
  const { data, loading, refetch } = useQuery<{ expenseSources: ExpenseSource[] }>(EXPENSE_SOURCES);
  const [create] = useMutation(CREATE_EXPENSE_SOURCE);
  const [update] = useMutation(UPDATE_EXPENSE_SOURCE);
  const [del] = useMutation(DELETE_EXPENSE_SOURCE);

  const confirm = useConfirm();
  const notify = useAlert();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseSource | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseSourceForm>({ resolver: zodResolver(expenseSourceSchema), defaultValues: { ...BLANK } });

  const sources = data?.expenseSources ?? [];
  const type = watch("type");

  function openNew() {
    setEditing(null);
    reset({ ...BLANK });
    setOpen(true);
  }
  function openEdit(s: ExpenseSource) {
    setEditing(s);
    reset({
      type: s.type, name: s.name, phone: s.phone ?? "", email: s.email ?? "",
      bankName: s.bankName ?? "", accountNumber: s.accountNumber ?? "", ifsc: s.ifsc ?? "",
      note: s.note ?? "", isActive: s.isActive,
    });
    setOpen(true);
  }

  async function onSave(form: ExpenseSourceForm) {
    const input = {
      type: form.type,
      name: form.name.trim(),
      phone: form.phone?.trim() || undefined,
      email: form.email?.trim() || undefined,
      bankName: form.bankName?.trim() || undefined,
      accountNumber: form.accountNumber?.trim() || undefined,
      ifsc: form.ifsc?.trim() || undefined,
      note: form.note?.trim() || undefined,
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

  async function remove(s: ExpenseSource) {
    const ok = await confirm({
      title: "Delete expense source",
      message: `Delete “${s.name}”?`,
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
    <Layout title="Expense Sources">
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button variant="contained" startIcon={<IPlus size={16} />} onClick={openNew}>New source</Button>
      </Box>

      <div className="card">
        <AsyncList loading={loading && !data} empty={sources.length === 0} emptyLabel="No expense sources yet.">
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell><TableCell>Type</TableCell><TableCell>Details</TableCell>
                  <TableCell>Status</TableCell><TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {sources.map((s) => (
                  <TableRow key={s.id} hover>
                    <TableCell><Typography fontWeight={700}>{s.name}</Typography></TableCell>
                    <TableCell>
                      <Chip size="small" variant="outlined" label={s.type === "PERSON" ? "Person" : "Account"} />
                    </TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{detailOf(s)}</Typography></TableCell>
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
          title={editing ? "Edit expense source" : "New expense source"}
          onClose={() => setOpen(false)}
          footer={<FormActions onCancel={() => setOpen(false)} onSave={handleSubmit(onSave)} busy={isSubmitting} />}
        >
          <RHFSelect control={control} name="type" label="Source type" options={TYPE_OPTIONS} error={errors.type?.message} emptyLabel="Select type" />
          <RHFField control={control} name="name" label={type === "ACCOUNT" ? "Account holder name" : "Person name"} error={errors.name?.message} />
          {type === "PERSON" && (
            <>
              <RHFField control={control} name="phone" label="Phone" error={errors.phone?.message} />
              <RHFField control={control} name="email" label="Email (optional)" type="email" error={errors.email?.message} />
            </>
          )}
          {type === "ACCOUNT" && (
            <>
              <RHFField control={control} name="bankName" label="Bank name" error={errors.bankName?.message} />
              <RHFField control={control} name="accountNumber" label="Account number" error={errors.accountNumber?.message} />
              <RHFField control={control} name="ifsc" label="IFSC (optional)" error={errors.ifsc?.message} />
            </>
          )}
          <RHFField control={control} name="note" label="Note (optional)" multiline error={errors.note?.message} />
          <RHFCheckbox control={control} name="isActive" label="Active" />
          {errors.root ? <Typography color="error" variant="body2" sx={{ mt: 1 }}>{errors.root.message}</Typography> : null}
        </Modal>
      )}
    </Layout>
  );
}
