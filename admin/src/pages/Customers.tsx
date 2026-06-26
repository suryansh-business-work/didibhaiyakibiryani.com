import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@apollo/client";
import { Button, Chip, Link, Tooltip, Typography } from "@mui/material";
import { CUSTOMERS_PAGE } from "../graphql/queries";
import { UPDATE_CUSTOMER, DELETE_CUSTOMER, DELETE_CUSTOMERS } from "../graphql/mutations";
import Layout from "../components/Layout";
import { FormActions, Modal, inr, fmtDate } from "../components/ui";
import { DataTable, useServerTable, type Column } from "../components/DataTable";
import { useAlert, useConfirm } from "../components/dialog";
import { RHFField, customerSchema, type CustomerForm } from "../form";

interface Customer {
  id: string; name: string; email: string; phone?: string;
  createdAt: string; orderCount: number; totalSpent: number;
}

export default function Customers() {
  const navigate = useNavigate();
  const { variables, tableProps } = useServerTable({ initialSortKey: "createdAt", initialSortDir: "desc" });
  const { data, loading, refetch } = useQuery<{ customersPage: { items: Customer[]; total: number } }>(CUSTOMERS_PAGE, { variables });
  const [updateCustomer] = useMutation(UPDATE_CUSTOMER);
  const [deleteCustomer] = useMutation(DELETE_CUSTOMER);
  const [deleteCustomers] = useMutation(DELETE_CUSTOMERS);
  const confirm = useConfirm();
  const notify = useAlert();

  const [editing, setEditing] = useState<Customer | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const {
    control, handleSubmit, reset, setError,
    formState: { errors, isSubmitting },
  } = useForm<CustomerForm>({ resolver: zodResolver(customerSchema), defaultValues: { name: "", phone: "" } });

  const customers = data?.customersPage.items ?? [];
  const total = data?.customersPage.total ?? 0;

  const columns = useMemo<Column<Customer>[]>(() => {
    const viewOrders = (c: Customer) =>
      navigate(`/orders?userId=${encodeURIComponent(c.id)}&name=${encodeURIComponent(c.name)}`);
    return [
      { key: "name", label: "Name", sortable: true, render: (c) => <Typography fontWeight={700}>{c.name}</Typography> },
      { key: "contact", label: "Contact", render: (c) => (
        <>
          <Typography variant="body2" color="text.secondary">{c.email}</Typography>
          <Typography variant="caption" color="text.secondary">{c.phone}</Typography>
        </>
      ) },
      { key: "createdAt", label: "Joined", sortable: true, render: (c) => <Typography variant="body2" color="text.secondary">{fmtDate(c.createdAt)}</Typography> },
      { key: "orderCount", label: "Orders", render: (c) => (
        <Tooltip title="View this customer's orders">
          <Chip size="small" variant="outlined" color="primary" label={c.orderCount} clickable onClick={() => viewOrders(c)} />
        </Tooltip>
      ) },
      { key: "totalSpent", label: "Lifetime value", align: "right", render: (c) => (
        <Link component="button" type="button" underline="hover" onClick={() => viewOrders(c)} sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
          {inr(c.totalSpent)}
        </Link>
      ) },
    ];
  }, [navigate]);

  function openEdit(c: Customer) {
    setEditing(c);
    reset({ name: c.name, phone: c.phone ?? "" });
  }

  async function onSave(form: CustomerForm) {
    if (!editing) return;
    try {
      await updateCustomer({ variables: { id: editing.id, name: form.name.trim(), phone: form.phone?.trim() || null } });
      setEditing(null);
      await refetch();
    } catch (e: unknown) {
      setError("root", { message: e instanceof Error ? e.message : "Could not save." });
    }
  }

  async function remove(c: Customer) {
    const ok = await confirm({ title: "Delete customer", message: `Delete “${c.name}”? Their account is permanently removed. This cannot be undone.`, confirmLabel: "Delete", danger: true });
    if (!ok) return;
    setDeletingId(c.id);
    try {
      await deleteCustomer({ variables: { id: c.id } });
      await refetch();
    } catch (e: unknown) {
      await notify({ title: "Could not delete", message: e instanceof Error ? e.message : "Could not delete the customer." });
    } finally {
      setDeletingId(null);
    }
  }

  async function bulkDelete(ids: string[]) {
    const ok = await confirm({ title: "Delete customers", message: `Delete ${ids.length} selected customer(s)? Their accounts are permanently removed.`, confirmLabel: "Delete all", danger: true });
    if (!ok) return;
    try {
      await deleteCustomers({ variables: { ids } });
      await refetch();
    } catch (e: unknown) {
      await notify({ title: "Could not delete", message: e instanceof Error ? e.message : "Could not delete the customers." });
    }
  }

  return (
    <Layout title="Signup Customers">
      <DataTable
        columns={columns}
        rows={customers}
        total={total}
        rowKey={(c) => c.id}
        loading={loading && !data}
        emptyLabel="No customers found."
        noun="customer"
        searchPlaceholder="Search name, email, phone…"
        onBulkDelete={bulkDelete}
        renderActions={(c) => (
          <>
            <Button size="small" onClick={() => openEdit(c)}>Edit</Button>
            <Button size="small" color="error" disabled={deletingId === c.id} onClick={() => remove(c)}>
              {deletingId === c.id ? "…" : "Delete"}
            </Button>
          </>
        )}
        {...tableProps}
      />

      {editing && (
        <Modal
          title={`Edit ${editing.name}`}
          onClose={() => setEditing(null)}
          footer={<FormActions onCancel={() => setEditing(null)} onSave={handleSubmit(onSave)} busy={isSubmitting} />}
        >
          <RHFField control={control} name="name" label="Name" error={errors.name?.message} />
          <RHFField control={control} name="phone" label="Phone" type="tel" error={errors.phone?.message} />
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
            Email ({editing.email}) is the login id and can't be changed here.
          </Typography>
          {errors.root ? <Typography color="error" variant="body2" sx={{ mt: 1 }}>{errors.root.message}</Typography> : null}
        </Modal>
      )}
    </Layout>
  );
}
