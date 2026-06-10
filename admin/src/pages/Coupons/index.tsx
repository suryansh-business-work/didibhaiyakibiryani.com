import { useState } from "react";
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
import {
  BLANK_FORM,
  couponToForm,
  type Coupon,
  type CouponForm,
  type FreeItemOption,
} from "./types";

export default function Coupons() {
  const { data, loading, refetch } = useQuery<{ coupons: Coupon[] }>(COUPONS);
  const { data: itemData } = useQuery<{ menuItems: FreeItemOption[] }>(MENU_ITEMS);
  const [create] = useMutation(CREATE_COUPON);
  const [update] = useMutation(UPDATE_COUPON);
  const [del] = useMutation(DELETE_COUPON);

  const confirm = useConfirm();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CouponForm>({ ...BLANK_FORM });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const coupons = data?.coupons ?? [];
  const items = itemData?.menuItems ?? [];

  function openNew() {
    setEditing(null);
    setForm({ ...BLANK_FORM });
    setErr("");
    setOpen(true);
  }

  function openEdit(c: Coupon) {
    setEditing(c);
    setForm(couponToForm(c));
    setErr("");
    setOpen(true);
  }

  function validate(): string {
    if (!form.code.trim() || !form.title.trim()) {
      return "Code and title are required.";
    }
    if (form.type === "FREE_ITEM" && !form.freeItemId) {
      return "Pick the free item.";
    }
    return "";
  }

  async function save() {
    const validationError = validate();
    if (validationError) {
      setErr(validationError);
      return;
    }
    setBusy(true);
    setErr("");
    const input = {
      code: form.code.trim().toUpperCase(),
      title: form.title.trim(),
      description: form.description,
      type: form.type,
      value: Number(form.value),
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
      minOrder: Number(form.minOrder),
      freeItemId: form.type === "FREE_ITEM" ? form.freeItemId : null,
      appOnly: form.appOnly,
      firstOrderOnly: form.firstOrderOnly,
      isActive: form.isActive,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
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
      setErr(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
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
          form={form}
          items={items}
          busy={busy}
          error={err}
          onChange={setForm}
          onClose={() => setOpen(false)}
          onSave={save}
        />
      )}
    </Layout>
  );
}
