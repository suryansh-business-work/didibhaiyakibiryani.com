import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@apollo/client";
import { SOCIETIES } from "../../graphql/queries";
import { CREATE_SOCIETY, UPDATE_SOCIETY, DELETE_SOCIETY, DELETE_SOCIETIES } from "../../graphql/mutations";
import { Button, Typography } from "@mui/material";
import Layout from "../../components/Layout";
import { FormActions, Modal, OnOffChip } from "../../components/ui";
import { IPlus } from "../../components/icons";
import { useAlert, useConfirm } from "../../components/dialog";
import { DataTable, useClientTable, type Column } from "../../components/DataTable";
import LocationPicker, { type LatLng } from "../../components/LocationPicker";
import { RHFField, RHFSelect, RHFCheckbox, societySchema, type SocietyForm } from "../../form";
import { STATE_OPTIONS } from "../../constants/india";

interface Society {
  id: string; name: string; area?: string;
  line1?: string; city?: string; state?: string; pincode?: string;
  lat?: number; lng?: number; sortOrder: number; isActive: boolean;
}
const BLANK: SocietyForm = { name: "", area: "", line1: "", city: "", state: "", pincode: "", lat: undefined, lng: undefined, sortOrder: 0, isActive: true };

export default function Societies() {
  const { data, loading, refetch } = useQuery<{ societies: Society[] }>(SOCIETIES);
  const [create] = useMutation(CREATE_SOCIETY);
  const [update] = useMutation(UPDATE_SOCIETY);
  const [del] = useMutation(DELETE_SOCIETY);
  const [delMany] = useMutation(DELETE_SOCIETIES);

  const confirm = useConfirm();
  const notify = useAlert();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Society | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    setError,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SocietyForm>({ resolver: zodResolver(societySchema), defaultValues: { ...BLANK } });

  const lat = watch("lat");
  const lng = watch("lng");
  const pin: LatLng | null = typeof lat === "number" && typeof lng === "number" ? { lat, lng } : null;

  const societies = data?.societies ?? [];

  const columns = useMemo<Column<Society>[]>(() => [
    {
      key: "name", label: "Name", sortable: true,
      searchValue: (s) => `${s.name} ${s.city ?? ""} ${s.state ?? ""}`, sortValue: (s) => s.name,
      render: (s) => <Typography fontWeight={700}>{s.name}</Typography>,
    },
    {
      key: "area", label: "Area", sortable: true,
      searchValue: (s) => s.area ?? "", sortValue: (s) => s.area ?? "",
      render: (s) => <Typography variant="body2" color="text.secondary">{s.area || "—"}</Typography>,
    },
    {
      key: "pincode", label: "Pincode", sortable: true,
      searchValue: (s) => s.pincode ?? "", sortValue: (s) => s.pincode ?? "",
      render: (s) => <Typography variant="body2" color="text.secondary">{s.pincode || "—"}</Typography>,
    },
    {
      key: "sortOrder", label: "Order", sortable: true, sortValue: (s) => s.sortOrder,
      render: (s) => <Typography variant="body2" color="text.secondary">{s.sortOrder}</Typography>,
    },
    { key: "isActive", label: "Status", render: (s) => <OnOffChip on={s.isActive} offLabel="Hidden" /> },
  ], []);

  const { tableProps } = useClientTable(societies, columns, { initialSortKey: "sortOrder", initialSortDir: "asc" });

  function openNew() {
    setEditing(null);
    reset({ ...BLANK });
    setOpen(true);
  }
  function openEdit(s: Society) {
    setEditing(s);
    reset({ name: s.name, area: s.area ?? "", line1: s.line1 ?? "", city: s.city ?? "", state: s.state ?? "", pincode: s.pincode ?? "", lat: s.lat ?? undefined, lng: s.lng ?? undefined, sortOrder: s.sortOrder, isActive: s.isActive });
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
      lat: form.lat ?? null,
      lng: form.lng ?? null,
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
    const ok = await confirm({ title: "Delete society", message: `Delete society “${s.name}”?`, confirmLabel: "Delete", danger: true });
    if (!ok) return;
    try {
      await del({ variables: { id: s.id } });
      await refetch();
    } catch (e: unknown) {
      await notify({ title: "Could not delete", message: e instanceof Error ? e.message : "Could not delete." });
    }
  }

  async function bulkDelete(ids: string[]) {
    const ok = await confirm({ title: "Delete societies", message: `Delete ${ids.length} selected society(ies)?`, confirmLabel: "Delete all", danger: true });
    if (!ok) return;
    try {
      await delMany({ variables: { ids } });
      await refetch();
    } catch (e: unknown) {
      await notify({ title: "Could not delete", message: e instanceof Error ? e.message : "Could not delete." });
    }
  }

  return (
    <Layout title="Societies">
      <DataTable
        columns={columns}
        rowKey={(s) => s.id}
        loading={loading && !data}
        emptyLabel="No societies yet."
        noun="society"
        searchPlaceholder="Search societies…"
        onBulkDelete={bulkDelete}
        renderActions={(s) => (
          <>
            <Button size="small" onClick={() => openEdit(s)}>Edit</Button>
            <Button size="small" color="error" onClick={() => remove(s)}>Delete</Button>
          </>
        )}
        toolbarEnd={<Button variant="contained" startIcon={<IPlus size={16} />} onClick={openNew}>New society</Button>}
        {...tableProps}
      />

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
          <LocationPicker
            value={pin}
            label="Society location on map"
            onChange={(next) => {
              setValue("lat", next.lat, { shouldDirty: true });
              setValue("lng", next.lng, { shouldDirty: true });
            }}
            onClear={() => {
              setValue("lat", undefined, { shouldDirty: true });
              setValue("lng", undefined, { shouldDirty: true });
            }}
          />
          <RHFField control={control} name="sortOrder" label="Sort order" type="number" error={errors.sortOrder?.message} />
          <RHFCheckbox control={control} name="isActive" label="Active" />
          {errors.root ? <Typography color="error" variant="body2" sx={{ mt: 1 }}>{errors.root.message}</Typography> : null}
        </Modal>
      )}
    </Layout>
  );
}
