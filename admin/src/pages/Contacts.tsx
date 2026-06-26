import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@apollo/client";
import { Button, Stack, Typography } from "@mui/material";
import { LEADS_PAGE, SOCIETIES } from "../graphql/queries";
import { CREATE_LEAD, UPDATE_LEAD, DELETE_LEAD, DELETE_LEADS } from "../graphql/mutations";
import Layout from "../components/Layout";
import { FormActions, Modal } from "../components/ui";
import { IPlus } from "../components/icons";
import { DataTable, useServerTable } from "../components/DataTable";
import { useAlert, useConfirm } from "../components/dialog";
import { RHFField, leadSchema, type LeadForm } from "../form";
import ContactAddressFields, { type SocietyRef } from "./ContactAddressFields";
import { contactColumns, type Lead } from "./contactsColumns";

const BLANK: LeadForm = {
  name: "", phone: "", email: "", note: "", addressMode: "ADDRESS",
  address: "", society: "", block: "", flat: "",
  city: "", state: "", pincode: "", lat: undefined, lng: undefined,
};

/** Non-signup contacts (leads). Added here, selectable in POS, and auto-removed
 * once the same email signs up for an account. */
export default function Contacts() {
  const navigate = useNavigate();
  const { variables, tableProps } = useServerTable({ initialSortKey: "createdAt", initialSortDir: "desc" });
  const { data, loading, refetch } = useQuery<{ leadsPage: { items: Lead[]; total: number } }>(LEADS_PAGE, { variables });
  const { data: socData } = useQuery<{ societies: SocietyRef[] }>(SOCIETIES);
  const [createLead] = useMutation(CREATE_LEAD);
  const [updateLead] = useMutation(UPDATE_LEAD);
  const [deleteLead] = useMutation(DELETE_LEAD);
  const [deleteLeads] = useMutation(DELETE_LEADS);
  const confirm = useConfirm();
  const notify = useAlert();

  const [editing, setEditing] = useState<Lead | null>(null);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const {
    control, handleSubmit, reset, setError, watch, setValue,
    formState: { errors, isSubmitting },
  } = useForm<LeadForm>({ resolver: zodResolver(leadSchema), defaultValues: BLANK });

  const leads = data?.leadsPage.items ?? [];
  const total = data?.leadsPage.total ?? 0;
  const societies = socData?.societies ?? [];
  const open = adding || Boolean(editing);

  const columns = useMemo(
    () =>
      contactColumns((l) =>
        navigate(`/orders?phone=${encodeURIComponent(l.phone)}&name=${encodeURIComponent(l.name)}`)
      ),
    [navigate]
  );

  function openAdd() {
    setEditing(null);
    setAdding(true);
    reset(BLANK);
  }
  function openEdit(l: Lead) {
    setAdding(false);
    setEditing(l);
    reset({
      name: l.name, phone: l.phone, email: l.email ?? "", note: l.note ?? "",
      addressMode: l.society ? "SOCIETY" : "ADDRESS",
      address: l.address ?? "", society: l.society ?? "", block: l.block ?? "", flat: l.flat ?? "",
      city: l.city ?? "", state: l.state ?? "", pincode: l.pincode ?? "", lat: l.lat ?? undefined, lng: l.lng ?? undefined,
    });
  }
  function close() {
    setAdding(false);
    setEditing(null);
  }

  async function onSave(form: LeadForm) {
    const bySociety = form.addressMode === "SOCIETY";
    const vars = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email?.trim() || null,
      note: form.note?.trim() || null,
      address: bySociety ? null : form.address?.trim() || null,
      society: bySociety ? form.society?.trim() || null : null,
      block: bySociety ? form.block?.trim() || null : null,
      flat: bySociety ? form.flat?.trim() || null : null,
      // City / State / Pin Code belong to Address mode only — a society already
      // carries its own city/state, so we don't ask (or store) them here.
      city: bySociety ? null : form.city?.trim() || null,
      state: bySociety ? null : form.state?.trim() || null,
      pincode: bySociety ? null : form.pincode?.trim() || null,
      // The map pin applies to both modes.
      lat: form.lat ?? null,
      lng: form.lng ?? null,
    };
    try {
      if (editing) await updateLead({ variables: { id: editing.id, ...vars } });
      else await createLead({ variables: vars });
      close();
      await refetch();
    } catch (e: unknown) {
      setError("root", { message: e instanceof Error ? e.message : "Could not save." });
    }
  }

  async function remove(l: Lead) {
    const ok = await confirm({ title: "Delete contact", message: `Delete “${l.name}”? This cannot be undone.`, confirmLabel: "Delete", danger: true });
    if (!ok) return;
    setDeletingId(l.id);
    try {
      await deleteLead({ variables: { id: l.id } });
      await refetch();
    } catch (e: unknown) {
      await notify({ title: "Could not delete", message: e instanceof Error ? e.message : "Could not delete the contact." });
    } finally {
      setDeletingId(null);
    }
  }

  async function bulkDelete(ids: string[]) {
    const ok = await confirm({ title: "Delete contacts", message: `Delete ${ids.length} selected contact(s)? This cannot be undone.`, confirmLabel: "Delete all", danger: true });
    if (!ok) return;
    try {
      await deleteLeads({ variables: { ids } });
      await refetch();
    } catch (e: unknown) {
      await notify({ title: "Could not delete", message: e instanceof Error ? e.message : "Could not delete the contacts." });
    }
  }

  return (
    <Layout title="Manual Customer Contacts">
      <DataTable
        columns={columns}
        rows={leads}
        total={total}
        rowKey={(l) => l.id}
        loading={loading && !data}
        emptyLabel="No contacts yet. Add walk-in / phone customers here."
        noun="contact"
        searchPlaceholder="Search name, phone, email…"
        onBulkDelete={bulkDelete}
        renderActions={(l) => (
          <>
            <Button size="small" onClick={() => openEdit(l)}>Edit</Button>
            <Button size="small" color="error" disabled={deletingId === l.id} onClick={() => remove(l)}>
              {deletingId === l.id ? "…" : "Delete"}
            </Button>
          </>
        )}
        toolbarEnd={<Button variant="contained" startIcon={<IPlus size={16} />} onClick={openAdd}>Add contact</Button>}
        {...tableProps}
      />

      {open && (
        <Modal
          title={editing ? `Edit ${editing.name}` : "Add contact"}
          onClose={close}
          footer={<FormActions onCancel={close} onSave={handleSubmit(onSave)} busy={isSubmitting} />}
        >
          <Stack spacing={2}>
            <RHFField control={control} name="name" label="Name" margin="none" error={errors.name?.message} />
            <RHFField control={control} name="phone" label="Phone" type="tel" margin="none" error={errors.phone?.message} />
            <RHFField control={control} name="email" label="Email (optional)" type="email" margin="none" error={errors.email?.message} />
            <RHFField control={control} name="note" label="Note (optional)" margin="none" error={errors.note?.message} />
            <ContactAddressFields control={control} errors={errors} watch={watch} setValue={setValue} societies={societies} />
          </Stack>
          {errors.root ? <Typography color="error" variant="body2" sx={{ mt: 1 }}>{errors.root.message}</Typography> : null}
        </Modal>
      )}
    </Layout>
  );
}
