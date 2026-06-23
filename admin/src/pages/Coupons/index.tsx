import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@apollo/client";
import { COUPONS, MENU_ITEMS } from "../../graphql/queries";
import {
  CREATE_COUPON,
  UPDATE_COUPON,
  DELETE_COUPON,
} from "../../graphql/mutations";
import Layout from "../../components/Layout";
import { AsyncList } from "../../components/ui";
import { IPlus } from "../../components/icons";
import { useConfirm } from "../../components/dialog";
import CouponsTable from "./CouponsTable";
import CouponModal from "./CouponModal";
import { couponSchema, type CouponForm } from "../../form";
import { BLANK_FORM, couponToForm, type Coupon, type FreeItemOption } from "./types";

export default function Coupons() {
  const { data, loading, refetch } = useQuery<{ coupons: Coupon[] }>(COUPONS);
  const { data: itemData } = useQuery<{ menuItems: FreeItemOption[] }>(MENU_ITEMS);
  const [create] = useMutation(CREATE_COUPON);
  const [update] = useMutation(UPDATE_COUPON);
  const [del] = useMutation(DELETE_COUPON);

  const confirm = useConfirm();

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
    const ok = await confirm({
      title: "Delete coupon",
      message: `Delete coupon ${c.code}?`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) {
      return;
    }
    await del({ variables: { id: c.id } });
    await refetch();
  }

  return (
    <Layout title="Coupons & Offers">
      <div className="toolbar">
        <div className="spacer" />
        <button className="btn btn-gold" onClick={openNew}>
          <IPlus size={16} /> New coupon
        </button>
      </div>

      <div className="card">
        <AsyncList
          loading={loading && !data}
          empty={coupons.length === 0}
          emptyLabel="No coupons yet."
        >
          <CouponsTable coupons={coupons} onEdit={openEdit} onDelete={remove} />
        </AsyncList>
      </div>

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
