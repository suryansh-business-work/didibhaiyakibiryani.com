import { Modal } from "../../components/ui";
import type { RiderForm } from "./types";

interface RiderModalProps {
  form: RiderForm;
  editing: boolean;
  busy: boolean;
  error: string;
  onChange: (form: RiderForm) => void;
  onClose: () => void;
  onSave: () => void;
}

export default function RiderModal({
  form,
  editing,
  busy,
  error,
  onChange,
  onClose,
  onSave,
}: Readonly<RiderModalProps>) {
  const set = (patch: Partial<RiderForm>) => onChange({ ...form, ...patch });
  const saveLabel = editing ? "Save changes" : "Create rider";

  return (
    <Modal
      title={editing ? "Edit delivery partner" : "New delivery partner"}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-gold" onClick={onSave} disabled={busy}>
            {busy ? "Saving…" : saveLabel}
          </button>
        </>
      }
    >
      <div className="field">
        <label>Full name</label>
        <input value={form.name} onChange={(e) => set({ name: e.target.value })} />
      </div>
      <div className="field">
        <label>Email (login id for the delivery app)</label>
        <input
          type="email"
          value={form.email}
          disabled={editing}
          onChange={(e) => set({ email: e.target.value })}
        />
        {editing && (
          <p className="muted" style={{ fontSize: "0.75rem", marginTop: 4 }}>
            Email is the rider's login id and can't be changed.
          </p>
        )}
      </div>
      <div className="field-row">
        <div className="field">
          <label>Phone</label>
          <input type="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
        </div>
        <div className="field">
          <label>{editing ? "New password (optional)" : "Password"}</label>
          <input
            type="password"
            value={form.password}
            placeholder={editing ? "Leave blank to keep current" : ""}
            onChange={(e) => set({ password: e.target.value })}
          />
        </div>
      </div>
      {editing && (
        <label className="check">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => set({ isActive: e.target.checked })}
          />{" "}
          Active (can sign in & receive deliveries)
        </label>
      )}
      <p className="muted" style={{ fontSize: "0.8rem" }}>
        The rider signs in at delivery.didibhaiyakibiryani.com with these credentials.
      </p>
      {error && <div className="error-text">{error}</div>}
    </Modal>
  );
}
