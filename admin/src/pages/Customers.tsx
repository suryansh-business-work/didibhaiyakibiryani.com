import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@apollo/client";
import { CUSTOMERS } from "../graphql/queries";
import { UPDATE_CUSTOMER, DELETE_CUSTOMER } from "../graphql/mutations";
import { Box, Button, Chip, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import Layout from "../components/Layout";
import { AsyncList, FormActions, Modal, inr, fmtDate } from "../components/ui";
import { ISearch } from "../components/icons";
import { useAlert, useConfirm } from "../components/dialog";
import { RHFField, customerSchema, type CustomerForm } from "../form";

interface Customer {
  id: string; name: string; email: string; phone?: string;
  createdAt: string; orderCount: number; totalSpent: number;
}

export default function Customers() {
  const [search, setSearch] = useState("");
  const { data, loading, refetch } = useQuery<{ customers: Customer[] }>(CUSTOMERS, {
    variables: { search: search || null },
  });
  const [updateCustomer] = useMutation(UPDATE_CUSTOMER);
  const [deleteCustomer] = useMutation(DELETE_CUSTOMER);
  const confirm = useConfirm();
  const notify = useAlert();

  const [editing, setEditing] = useState<Customer | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CustomerForm>({ resolver: zodResolver(customerSchema), defaultValues: { name: "", phone: "" } });

  const customers = data?.customers ?? [];

  function openEdit(c: Customer) {
    setEditing(c);
    reset({ name: c.name, phone: c.phone ?? "" });
  }

  async function onSave(form: CustomerForm) {
    if (!editing) return;
    try {
      await updateCustomer({
        variables: { id: editing.id, name: form.name.trim(), phone: form.phone?.trim() || null },
      });
      setEditing(null);
      await refetch();
    } catch (e: unknown) {
      setError("root", { message: e instanceof Error ? e.message : "Could not save." });
    }
  }

  async function remove(c: Customer) {
    const ok = await confirm({
      title: "Delete customer",
      message: `Delete “${c.name}”? Their account is permanently removed. This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    setDeletingId(c.id);
    try {
      await deleteCustomer({ variables: { id: c.id } });
      await refetch();
    } catch (e: unknown) {
      await notify({
        title: "Could not delete",
        message: e instanceof Error ? e.message : "Could not delete the customer.",
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Layout title="Customers">
      <div className="toolbar">
        <div className="search">
          <ISearch size={16} />
          <input
            placeholder="Search name, email, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="spacer" />
        <span className="muted">{customers.length} customer(s)</span>
      </div>

      <div className="card">
        <AsyncList loading={loading && !data} empty={customers.length === 0} emptyLabel="No customers found.">
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell><TableCell>Contact</TableCell><TableCell>Joined</TableCell>
                  <TableCell>Orders</TableCell><TableCell align="right">Lifetime value</TableCell><TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell><Typography fontWeight={700}>{c.name}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{c.email}</Typography>
                      <Typography variant="caption" color="text.secondary">{c.phone}</Typography>
                    </TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{fmtDate(c.createdAt)}</Typography></TableCell>
                    <TableCell><Chip size="small" variant="outlined" color="primary" label={c.orderCount} /></TableCell>
                    <TableCell align="right"><Typography fontWeight={700} sx={{ fontVariantNumeric: "tabular-nums" }}>{inr(c.totalSpent)}</Typography></TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      <Button size="small" onClick={() => openEdit(c)}>Edit</Button>
                      <Button size="small" color="error" disabled={deletingId === c.id} onClick={() => remove(c)}>
                        {deletingId === c.id ? "…" : "Delete"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </AsyncList>
      </div>

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
