import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@apollo/client";
import { CUSTOMERS } from "../graphql/queries";
import { UPDATE_CUSTOMER, DELETE_CUSTOMER } from "../graphql/mutations";
import Layout from "../components/Layout";
import { AsyncList, Modal, inr, fmtDate } from "../components/ui";
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
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th><th>Contact</th><th>Joined</th><th>Orders</th>
                  <th style={{ textAlign: "right" }}>Lifetime value</th><th></th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td className="t-strong">{c.name}</td>
                    <td className="muted">{c.email}<div style={{ fontSize: "0.78rem" }}>{c.phone}</div></td>
                    <td className="muted">{fmtDate(c.createdAt)}</td>
                    <td><span className="badge badge--gold">{c.orderCount}</span></td>
                    <td className="t-mono t-strong" style={{ textAlign: "right" }}>{inr(c.totalSpent)}</td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>Edit</button>{" "}
                      <button className="btn btn-danger btn-sm" disabled={deletingId === c.id} onClick={() => remove(c)}>
                        {deletingId === c.id ? "…" : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncList>
      </div>

      {editing && (
        <Modal
          title={`Edit ${editing.name}`}
          onClose={() => setEditing(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-gold" onClick={handleSubmit(onSave)} disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save"}</button>
            </>
          }
        >
          <RHFField control={control} name="name" label="Name" error={errors.name?.message} />
          <RHFField control={control} name="phone" label="Phone" type="tel" error={errors.phone?.message} />
          <p className="muted" style={{ fontSize: "0.8rem" }}>Email ({editing.email}) is the login id and can't be changed here.</p>
          {errors.root && <div className="error-text">{errors.root.message}</div>}
        </Modal>
      )}
    </Layout>
  );
}
