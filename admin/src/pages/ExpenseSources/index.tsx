import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@apollo/client";
import { EXPENSE_SOURCES } from "../../graphql/queries";
import {
  CREATE_EXPENSE_SOURCE,
  UPDATE_EXPENSE_SOURCE,
  DELETE_EXPENSE_SOURCE,
  DELETE_EXPENSE_SOURCES,
} from "../../graphql/mutations";
import { Button, Chip, Typography } from "@mui/material";
import Layout from "../../components/Layout";
import { FormActions, Modal, OnOffChip } from "../../components/ui";
import { IPlus } from "../../components/icons";
import { useAlert, useConfirm } from "../../components/dialog";
import { DataTable, useClientTable, type Column } from "../../components/DataTable";
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
  const [delMany] = useMutation(DELETE_EXPENSE_SOURCES);

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

  const columns = useMemo<Column<ExpenseSource>[]>(() => [
    {
      key: "name", label: "Name", sortable: true,
      searchValue: (s) => `${s.name} ${detailOf(s)}`, sortValue: (s) => s.name,
      render: (s) => <Typography fontWeight={700}>{s.name}</Typography>,
    },
    {
      key: "type", label: "Type", sortable: true, sortValue: (s) => s.type,
      render: (s) => <Chip size="small" variant="outlined" label={s.type === "PERSON" ? "Person" : "Account"} />,
    },
    {
      key: "details", label: "Details",
      searchValue: (s) => detailOf(s),
      render: (s) => <Typography variant="body2" color="text.secondary">{detailOf(s)}</Typography>,
    },
    { key: "isActive", label: "Status", render: (s) => <OnOffChip on={s.isActive} offLabel="Hidden" /> },
  ], []);

  const { tableProps } = useClientTable(sources, columns, { initialSortKey: "name", initialSortDir: "asc" });

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
    const ok = await confirm({ title: "Delete expense source", message: `Delete “${s.name}”?`, confirmLabel: "Delete", danger: true });
    if (!ok) return;
    try {
      await del({ variables: { id: s.id } });
      await refetch();
    } catch (e: unknown) {
      await notify({ title: "Could not delete", message: e instanceof Error ? e.message : "Could not delete." });
    }
  }

  async function bulkDelete(ids: string[]) {
    const ok = await confirm({ title: "Delete expense sources", message: `Delete ${ids.length} selected source(s)?`, confirmLabel: "Delete all", danger: true });
    if (!ok) return;
    try {
      await delMany({ variables: { ids } });
      await refetch();
    } catch (e: unknown) {
      await notify({ title: "Could not delete", message: e instanceof Error ? e.message : "Could not delete." });
    }
  }

  return (
    <Layout title="Expense Sources">
      <DataTable
        columns={columns}
        rowKey={(s) => s.id}
        loading={loading && !data}
        emptyLabel="No expense sources yet."
        noun="source"
        searchPlaceholder="Search sources…"
        onBulkDelete={bulkDelete}
        renderActions={(s) => (
          <>
            <Button size="small" onClick={() => openEdit(s)}>Edit</Button>
            <Button size="small" color="error" onClick={() => remove(s)}>Delete</Button>
          </>
        )}
        toolbarEnd={<Button variant="contained" startIcon={<IPlus size={16} />} onClick={openNew}>New source</Button>}
        {...tableProps}
      />

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
