import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { Modal } from "../../components/ui";
import { RHFField, RHFCheckbox, type CouponForm } from "../../form";
import { TYPE_OPTIONS, type FreeItemOption } from "./types";

interface CouponModalProps {
  editing: boolean;
  control: Control<CouponForm>;
  errors: FieldErrors<CouponForm>;
  type: string;
  items: FreeItemOption[];
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export default function CouponModal({
  editing,
  control,
  errors,
  type,
  items,
  isSubmitting,
  onClose,
  onSubmit,
}: Readonly<CouponModalProps>) {
  const isAmountType = type === "PERCENT" || type === "FLAT";
  const valueLabel = type === "PERCENT" ? "Percent (%)" : "Amount (₹)";

  return (
    <Modal
      title={editing ? "Edit coupon" : "New coupon"}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-gold" onClick={onSubmit} disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save"}</button>
        </>
      }
    >
      <div className="field-row">
        <RHFField control={control} name="code" label="Code" placeholder="BIRYANI50" error={errors.code?.message} />
        <div className="field">
          <label>Type</label>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <select value={field.value} onChange={field.onChange}>
                {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            )}
          />
        </div>
      </div>
      <RHFField control={control} name="title" label="Title" error={errors.title?.message} />
      <RHFField control={control} name="description" label="Description" error={errors.description?.message} />

      {isAmountType && (
        <div className="field-row">
          <RHFField control={control} name="value" label={valueLabel} type="number" error={errors.value?.message} />
          {type === "PERCENT" && (
            <RHFField control={control} name="maxDiscount" label="Max discount (₹)" type="number" error={errors.maxDiscount?.message} />
          )}
        </div>
      )}

      {type === "FREE_ITEM" && (
        <div className="field">
          <label>Free item</label>
          <Controller
            control={control}
            name="freeItemId"
            render={({ field }) => (
              <select value={field.value ?? ""} onChange={field.onChange} style={errors.freeItemId ? { borderColor: "var(--red)" } : undefined}>
                <option value="">Select…</option>
                {items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            )}
          />
          {errors.freeItemId ? <div className="field-error">{errors.freeItemId.message}</div> : null}
        </div>
      )}

      <div className="field-row">
        <RHFField control={control} name="minOrder" label="Min order (₹)" type="number" error={errors.minOrder?.message} />
        <RHFField control={control} name="usageLimit" label="Usage limit (0 = ∞)" type="number" error={errors.usageLimit?.message} />
      </div>

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 4 }}>
        <RHFCheckbox control={control} name="firstOrderOnly" label="First order only" />
        <RHFCheckbox control={control} name="appOnly" label="App only" />
        <RHFCheckbox control={control} name="isActive" label="Active" />
      </div>
      {errors.root && <div className="error-text">{errors.root.message}</div>}
    </Modal>
  );
}
