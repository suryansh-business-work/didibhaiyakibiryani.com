import { Modal } from "../../components/ui";
import type { RiderForm } from "./types";

interface RiderModalProps {
  form: RiderForm;
  busy: boolean;
  error: string;
  onChange: (form: RiderForm) => void;
  onClose: () => void;
  onSave: () => void;
}

export default function RiderModal({
  form,
  busy,
  error,
  onChange,
  onClose,
  onSave,
}: Readonly<RiderModalProps>) {
  const set = (patch: Partial<RiderForm>) => onChange({ ...form, ...patch });

  return (
    <Modal
      title="New delivery partner"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-gold" onClick={onSave} disabled={busy}>
            {busy ? "Creating…" : "Create rider"}
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
        <input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} />
      </div>
      <div className="field-row">
        <div className="field">
          <label>Phone</label>
          <input type="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => set({ password: e.target.value })}
          />
        </div>
      </div>
      <p className="muted" style={{ fontSize: "0.8rem" }}>
        The rider signs in at delivery.didibhaiyakibiryani.com with these credentials.
      </p>
      {error && <div className="error-text">{error}</div>}
    </Modal>
  );
}
