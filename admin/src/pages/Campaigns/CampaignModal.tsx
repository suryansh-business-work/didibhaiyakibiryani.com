import { Modal } from "../../components/ui";
import type { CampaignForm } from "./types";

interface CampaignModalProps {
  form: CampaignForm;
  busy: boolean;
  error: string;
  onChange: (form: CampaignForm) => void;
  onClose: () => void;
  onSend: () => void;
}

export default function CampaignModal({
  form,
  busy,
  error,
  onChange,
  onClose,
  onSend,
}: Readonly<CampaignModalProps>) {
  const set = (patch: Partial<CampaignForm>) => onChange({ ...form, ...patch });

  return (
    <Modal
      title="New campaign"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-gold" onClick={onSend} disabled={busy}>
            {busy ? "Sending…" : "Send to all customers"}
          </button>
        </>
      }
    >
      <div className="field-row">
        <div className="field">
          <label>Campaign name</label>
          <input
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="Weekend feast offer"
          />
        </div>
        <div className="field">
          <label>Channel</label>
          <select
            value={form.channel}
            onChange={(e) => set({ channel: e.target.value as CampaignForm["channel"] })}
          >
            <option value="EMAIL">Email</option>
            <option value="WHATSAPP">WhatsApp</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label>Subject / headline</label>
        <input
          value={form.subject}
          onChange={(e) => set({ subject: e.target.value })}
          placeholder="Weekend feast: 20% off all biryanis"
        />
      </div>
      <div className="field">
        <label>Message (blank line = new paragraph)</label>
        <textarea
          rows={6}
          value={form.body}
          onChange={(e) => set({ body: e.target.value })}
          placeholder={"Hot deal!\n\nThis weekend only — 20% off every biryani."}
        />
      </div>
      <div className="field-row">
        <div className="field">
          <label>Button label (optional)</label>
          <input
            value={form.ctaLabel}
            onChange={(e) => set({ ctaLabel: e.target.value })}
            placeholder="Order now"
          />
        </div>
        <div className="field">
          <label>Button link (optional)</label>
          <input
            type="url"
            value={form.ctaUrl}
            onChange={(e) => set({ ctaUrl: e.target.value })}
            placeholder="https://native.didibhaiyakibiryani.com"
          />
        </div>
      </div>
      {error && <div className="error-text">{error}</div>}
    </Modal>
  );
}
