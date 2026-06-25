import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@apollo/client";
import { COUPONS, MENU_ITEMS } from "../../graphql/queries";
import {
  CREATE_COUPON,
  UPDATE_COUPON,
  DELETE_COUPON,
  DELETE_COUPONS,
} from "../../graphql/mutations";
import { Button, Chip, Stack, Typography } from "@mui/material";
import Layout from "../../components/Layout";
import { OnOffChip, inr } from "../../components/ui";
import { IPlus } from "../../components/icons";
import { useAlert, useConfirm } from "../../components/dialog";
import { DataTable, useClientTable, type Column } from "../../components/DataTable";
import CouponModal from "./CouponModal";
import { couponSchema, type CouponForm } from "../../form";
import { BLANK_FORM, TYPE_LABEL, couponToForm, describeCoupon, type Coupon, type FreeItemOption } from "./types";

export default function Coupons() {
  const { data, loading, refetch } = useQuery<{ coupons: Coupon[] }>(COUPONS);
  const { data: itemData } = useQuery<{ menuItems: FreeItemOption[] }>(MENU_ITEMS);
  const [create] = useMutation(CREATE_COUPON);
  const [update] = useMutation(UPDATE_COUPON);
  const [del] = useMutation(DELETE_COUPON);
  const [delMany] = useMutation(DELETE_COUPONS);

  const confirm = useConfirm();
  const notify = useAlert();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CouponForm>({ resolver: zodResolver(couponSchema), defaultValues: { ...BLANK_FORM } });

  const coupons = data?.coupons ?? [];
  const items = itemData?.menuItems ?? [];

  const columns = useMemo<Column<Coupon>[]>(() => [
    {
      key: "code", label: "Code", sortable: true,
      searchValue: (c) => `${c.code} ${c.title}`, sortValue: (c) => c.code,
      render: (c) => (
        <>
          <Typography fontWeight={700} sx={{ letterSpacing: 1 }}>{c.code}</Typography>
          <Typography variant="caption" color="text.secondary">{c.title}</Typography>
        </>
      ),
    },
    {
      key: "type", label: "Offer", sortable: true,
      searchValue: (c) => `${TYPE_LABEL[c.type] ?? ""} ${describeCoupon(c)}`, sortValue: (c) => TYPE_LABEL[c.type] ?? c.type,
      render: (c) => (
        <>
          <Chip size="small" variant="outlined" color="primary" label={TYPE_LABEL[c.type]} />
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>{describeCoupon(c)}</Typography>
        </>
      ),
    },
    {
      key: "minOrder", label: "Min order", sortable: true, sortValue: (c) => c.minOrder,
      render: (c) => <Typography variant="body2" color="text.secondary">{c.minOrder ? inr(c.minOrder) : "—"}</Typography>,
    },
    {
      key: "flags", label: "Flags",
      render: (c) => (
        <Stack direction="row" spacing={0.5}>
          {c.firstOrderOnly ? <Chip size="small" variant="outlined" color="info" label="1st order" /> : null}
          {c.appOnly ? <Chip size="small" variant="outlined" label="App only" /> : null}
        </Stack>
      ),
    },
    {
      key: "usedCount", label: "Used", sortable: true, sortValue: (c) => c.usedCount,
      render: (c) => <Typography variant="body2" color="text.secondary">{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</Typography>,
    },
    { key: "isActive", label: "Status", render: (c) => <OnOffChip on={c.isActive} /> },
  ], []);

  const { tableProps } = useClientTable(coupons, columns, { initialSortKey: "code", initialSortDir: "asc" });

  function openNew() {
    setEditing(null);
    reset({ ...BLANK_FORM });
    setOpen(true);
  }

  function openEdit(c: Coupon) {
    setEditing(c);
    reset(couponToForm(c));
    setOpen(true);
  }

  async function onSave(form: CouponForm) {
    const input = {
      code: form.code.trim().toUpperCase(),
      title: form.title.trim(),
      description: form.description,
      type: form.type,
      value: form.value,
      maxDiscount: form.maxDiscount ? form.maxDiscount : null,
      minOrder: form.minOrder,
      freeItemId: form.type === "FREE_ITEM" ? form.freeItemId : null,
      appOnly: form.appOnly,
      firstOrderOnly: form.firstOrderOnly,
      isActive: form.isActive,
      usageLimit: form.usageLimit ? form.usageLimit : null,
    };
    try {
      if (editing) {
        await update({ variables: { id: editing.id, input } });
      } else {
        await create({ variables: { input } });
      }
      setOpen(false);
      await refetch();
    } catch (e: unknown) {
      setError("root", { message: e instanceof Error ? e.message : "Could not save." });
    }
  }

  async function remove(c: Coupon) {
    const ok = await confirm({ title: "Delete coupon", message: `Delete coupon ${c.code}?`, confirmLabel: "Delete", danger: true });
    if (!ok) return;
    await del({ variables: { id: c.id } });
    await refetch();
  }

  async function bulkDelete(ids: string[]) {
    const ok = await confirm({ title: "Delete coupons", message: `Delete ${ids.length} selected coupon(s)?`, confirmLabel: "Delete all", danger: true });
    if (!ok) return;
    try {
      await delMany({ variables: { ids } });
      await refetch();
    } catch (e: unknown) {
      await notify({ title: "Could not delete", message: e instanceof Error ? e.message : "Could not delete." });
    }
  }

  return (
    <Layout title="Coupons & Offers">
      <DataTable
        columns={columns}
        rowKey={(c) => c.id}
        loading={loading && !data}
        emptyLabel="No coupons yet."
        noun="coupon"
        searchPlaceholder="Search coupons…"
        onBulkDelete={bulkDelete}
        renderActions={(c) => (
          <>
            <Button size="small" onClick={() => openEdit(c)}>Edit</Button>
            <Button size="small" color="error" onClick={() => remove(c)}>Delete</Button>
          </>
        )}
        toolbarEnd={<Button variant="contained" startIcon={<IPlus size={16} />} onClick={openNew}>New coupon</Button>}
        {...tableProps}
      />

      {open && (
        <CouponModal
          editing={Boolean(editing)}
          control={control}
          errors={errors}
          type={watch("type")}
          items={items}
          isSubmitting={isSubmitting}
          onClose={() => setOpen(false)}
          onSubmit={handleSubmit(onSave)}
        />
      )}
    </Layout>
  );
}
