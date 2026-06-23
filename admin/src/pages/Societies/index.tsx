import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@apollo/client";
import { SOCIETIES } from "../../graphql/queries";
import { CREATE_SOCIETY, UPDATE_SOCIETY, DELETE_SOCIETY } from "../../graphql/mutations";
import { Box, Button, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import Layout from "../../components/Layout";
import { AsyncList, FormActions, Modal, OnOffChip } from "../../components/ui";
import { IPlus } from "../../components/icons";
import { useAlert, useConfirm } from "../../components/dialog";
import { RHFField, RHFSelect, RHFCheckbox, societySchema, type SocietyForm } from "../../form";
import { STATE_OPTIONS } from "../../constants/india";

interface Society {
  id: string; name: string; area?: string;
  line1?: string; city?: string; state?: string; pincode?: string;
  sortOrder: number; isActive: boolean;
}
const BLANK: SocietyForm = { name: "", area: "", line1: "", city: "", state: "", pincode: "", sortOrder: 0, isActive: true };

export default function Societies() {
  const { data, loading, refetch } = useQuery<{ societies: Society[] }>(SOCIETIES);
  const [create] = useMutation(CREATE_SOCIETY);
  const [update] = useMutation(UPDATE_SOCIETY);
  const [del] = useMutation(DELETE_SOCIETY);

  const confirm = useConfirm();
  const notify = useAlert();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Society | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SocietyForm>({ resolver: zodResolver(societySchema), defaultValues: { ...BLANK } });

  const societies = data?.societies ?? [];

  function openNew() {
    setEditing(null);
    reset({ ...BLANK });
    setOpen(true);
  }
  function openEdit(s: Society) {
    setEditing(s);
    reset({ name: s.name, area: s.area ?? "", line1: s.line1 ?? "", city: s.city ?? "", state: s.state ?? "", pincode: s.pincode ?? "", sortOrder: s.sortOrder, isActive: s.isActive });
    setOpen(true);
  }

  async function onSave(form: SocietyForm) {
    const input = {
      name: form.name.trim(),
      area: form.area?.trim(),
      line1: form.line1?.trim(),
      city: form.city?.trim(),
      state: form.state?.trim(),
      pincode: form.pincode?.trim(),
      sortOrder: form.sortOrder,
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

  async function remove(s: Society) {
    const ok = await confirm({
      title: "Delete society",
      message: `Delete society “${s.name}”?`,
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
    <Layout title="Societies">
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button variant="contained" startIcon={<IPlus size={16} />} onClick={openNew}>New society</Button>
      </Box>

      <div className="card">
        <AsyncList loading={loading && !data} empty={societies.length === 0} emptyLabel="No societies yet.">
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell><TableCell>Area</TableCell><TableCell>Pincode</TableCell>
                  <TableCell>Order</TableCell><TableCell>Status</TableCell><TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {societies.map((s) => (
                  <TableRow key={s.id} hover>
                    <TableCell><Typography fontWeight={700}>{s.name}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{s.area || "—"}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{s.pincode || "—"}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{s.sortOrder}</Typography></TableCell>
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
          title={editing ? "Edit society" : "New society"}
          onClose={() => setOpen(false)}
          footer={<FormActions onCancel={() => setOpen(false)} onSave={handleSubmit(onSave)} busy={isSubmitting} />}
        >
          <RHFField control={control} name="name" label="Name" placeholder="e.g. Prestige Lakeside" error={errors.name?.message} />
          <RHFField control={control} name="area" label="Area (optional)" placeholder="e.g. Whitefield" error={errors.area?.message} />
          <RHFField control={control} name="line1" label="Address line (optional)" placeholder="Street / landmark" error={errors.line1?.message} />
          <RHFField control={control} name="city" label="City (optional)" error={errors.city?.message} />
          <RHFSelect control={control} name="state" label="State (optional)" options={STATE_OPTIONS} error={errors.state?.message} />
          <RHFField control={control} name="pincode" label="Pincode (optional)" error={errors.pincode?.message} />
          <RHFField control={control} name="sortOrder" label="Sort order" type="number" error={errors.sortOrder?.message} />
          <RHFCheckbox control={control} name="isActive" label="Active" />
          {errors.root ? <Typography color="error" variant="body2" sx={{ mt: 1 }}>{errors.root.message}</Typography> : null}
        </Modal>
      )}
    </Layout>
  );
}
