import { Modal } from "../../components/ui";
import {
  TYPE_OPTIONS,
  type CouponForm,
  type FreeItemOption,
} from "./types";

interface CouponModalProps {
  editing: boolean;
  form: CouponForm;
  items: FreeItemOption[];
  busy: boolean;
  error: string;
  onChange: (form: CouponForm) => void;
  onClose: () => void;
  onSave: () => void;
}

export default function CouponModal({
  editing,
  form,
  items,
  busy,
  error,
  onChange,
  onClose,
  onSave,
}: Readonly<CouponModalProps>) {
  const set = (patch: Partial<CouponForm>) => onChange({ ...form, ...patch });
  const isAmountType = form.type === "PERCENT" || form.type === "FLAT";
  const valueLabel = form.type === "PERCENT" ? "Percent (%)" : "Amount (₹)";

  return (
    <Modal
      title={editing ? "Edit coupon" : "New coupon"}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-gold" onClick={onSave} disabled={busy}>
            {busy ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      <div className="field-row">
        <div className="field">
          <label>Code</label>
          <input
            value={form.code}
            onChange={(e) => set({ code: e.target.value.toUpperCase() })}
            placeholder="BIRYANI50"
          />
        </div>
        <div className="field">
          <label>Type</label>
          <select value={form.type} onChange={(e) => set({ type: e.target.value })}>
            {TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label>Title</label>
        <input value={form.title} onChange={(e) => set({ title: e.target.value })} />
      </div>
      <div className="field">
        <label>Description</label>
        <input
          value={form.description}
          onChange={(e) => set({ description: e.target.value })}
        />
      </div>

      {isAmountType && (
        <div className="field-row">
          <div className="field">
            <label>{valueLabel}</label>
            <input
              type="number"
              value={form.value}
              onChange={(e) => set({ value: Number(e.target.value) })}
            />
          </div>
          {form.type === "PERCENT" && (
            <div className="field">
              <label>Max discount (₹)</label>
              <input
                type="number"
                value={form.maxDiscount}
                onChange={(e) => set({ maxDiscount: Number(e.target.value) })}
              />
            </div>
          )}
        </div>
      )}

      {form.type === "FREE_ITEM" && (
        <div className="field">
          <label>Free item</label>
          <select
            value={form.freeItemId}
            onChange={(e) => set({ freeItemId: e.target.value })}
          >
            <option value="">Select…</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="field-row">
        <div className="field">
          <label>Min order (₹)</label>
          <input
            type="number"
            value={form.minOrder}
            onChange={(e) => set({ minOrder: Number(e.target.value) })}
          />
        </div>
        <div className="field">
          <label>Usage limit (0 = ∞)</label>
          <input
            type="number"
            value={form.usageLimit}
            onChange={(e) => set({ usageLimit: Number(e.target.value) })}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 4 }}>
        <label className="check">
          <input
            type="checkbox"
            checked={form.firstOrderOnly}
            onChange={(e) => set({ firstOrderOnly: e.target.checked })}
          />{" "}
          First order only
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={form.appOnly}
            onChange={(e) => set({ appOnly: e.target.checked })}
          />{" "}
          App only
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => set({ isActive: e.target.checked })}
          />{" "}
          Active
        </label>
      </div>
      {error && <div className="error-text">{error}</div>}
    </Modal>
  );
}
