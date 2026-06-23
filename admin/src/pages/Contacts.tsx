import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@apollo/client";
import { Box, Button, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { LEADS, SOCIETIES } from "../graphql/queries";
import { CREATE_LEAD, UPDATE_LEAD, DELETE_LEAD } from "../graphql/mutations";
import Layout from "../components/Layout";
import { AsyncList, FormActions, Modal, fmtDate } from "../components/ui";
import { ISearch, IPlus } from "../components/icons";
import { useAlert, useConfirm } from "../components/dialog";
import { RHFField, leadSchema, type LeadForm } from "../form";
import ContactAddressFields from "./ContactAddressFields";

interface Lead {
  id: string; name: string; phone: string; email?: string; note?: string;
  address?: string; society?: string; block?: string; flat?: string; createdAt: string;
}

const BLANK: LeadForm = { name: "", phone: "", email: "", note: "", addressMode: "ADDRESS", address: "", society: "", block: "", flat: "" };

function leadAddress(l: Lead): string {
  if (l.society) return [l.flat ? `Flat ${l.flat}` : "", l.block, l.society].filter(Boolean).join(", ");
  return l.address ?? "";
}

/** Non-signup contacts (leads). Added here, selectable in POS, and auto-removed
 * once the same email signs up for an account. */
export default function Contacts() {
  const [search, setSearch] = useState("");
  const { data, loading, refetch } = useQuery<{ leads: Lead[] }>(LEADS, { variables: { search: search || null } });
  const { data: socData } = useQuery<{ societies: { id: string; name: string }[] }>(SOCIETIES);
  const [createLead] = useMutation(CREATE_LEAD);
  const [updateLead] = useMutation(UPDATE_LEAD);
  const [deleteLead] = useMutation(DELETE_LEAD);
  const confirm = useConfirm();
  const notify = useAlert();

  const [editing, setEditing] = useState<Lead | null>(null);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const {
    control, handleSubmit, reset, setError, watch, setValue,
    formState: { errors, isSubmitting },
  } = useForm<LeadForm>({ resolver: zodResolver(leadSchema), defaultValues: BLANK });

  const leads = data?.leads ?? [];
  const societyOptions = (socData?.societies ?? []).map((s) => ({ value: s.name, label: s.name }));
  const open = adding || Boolean(editing);

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

  return (
    <Layout title="Contacts">
      <div className="toolbar">
        <div className="search">
          <ISearch size={16} />
          <input placeholder="Search name, phone, email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="spacer" />
        <span className="muted">{leads.length} contact(s)</span>
        <Button variant="contained" startIcon={<IPlus size={16} />} onClick={openAdd}>Add contact</Button>
      </div>

      <div className="card">
        <AsyncList loading={loading && !data} empty={leads.length === 0} emptyLabel="No contacts yet. Add walk-in / phone customers here.">
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell><TableCell>Contact</TableCell><TableCell>Address</TableCell><TableCell>Note</TableCell><TableCell>Added</TableCell><TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {leads.map((l) => (
                  <TableRow key={l.id} hover>
                    <TableCell><Typography fontWeight={700}>{l.name}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{l.phone}</Typography>
                      <Typography variant="caption" color="text.secondary">{l.email}</Typography>
                    </TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{leadAddress(l) || "—"}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{l.note}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{fmtDate(l.createdAt)}</Typography></TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      <Button size="small" onClick={() => openEdit(l)}>Edit</Button>
                      <Button size="small" color="error" disabled={deletingId === l.id} onClick={() => remove(l)}>
                        {deletingId === l.id ? "…" : "Delete"}
                      </Button>
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
          title={editing ? `Edit ${editing.name}` : "Add contact"}
          onClose={close}
          footer={<FormActions onCancel={close} onSave={handleSubmit(onSave)} busy={isSubmitting} />}
        >
          <RHFField control={control} name="name" label="Name" error={errors.name?.message} />
          <RHFField control={control} name="phone" label="Phone" type="tel" error={errors.phone?.message} />
          <RHFField control={control} name="email" label="Email (optional)" type="email" error={errors.email?.message} />
          <RHFField control={control} name="note" label="Note (optional)" error={errors.note?.message} />
          <ContactAddressFields control={control} errors={errors} watch={watch} setValue={setValue} societyOptions={societyOptions} />
          {errors.root ? <Typography color="error" variant="body2" sx={{ mt: 1 }}>{errors.root.message}</Typography> : null}
        </Modal>
      )}
    </Layout>
  );
}
