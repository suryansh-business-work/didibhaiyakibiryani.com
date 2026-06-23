import { Box, MenuItem, TextField, Typography } from "@mui/material";
import { Modal, FormActions } from "../../components/ui";
import type { CampaignForm } from "./types";

interface CampaignModalProps {
  form: CampaignForm;
  busy: boolean;
  error: string;
  onChange: (form: CampaignForm) => void;
  onClose: () => void;
  onSend: () => void;
}

export default function CampaignModal({ form, busy, error, onChange, onClose, onSend }: Readonly<CampaignModalProps>) {
  const set = (patch: Partial<CampaignForm>) => onChange({ ...form, ...patch });

  return (
    <Modal
      title="New campaign"
      onClose={onClose}
      footer={<FormActions onCancel={onClose} onSave={onSend} busy={busy} saveLabel="Send to all customers" />}
    >
      <Box sx={{ display: "flex", gap: 1.5 }}>
        <TextField
          label="Campaign name"
          size="small"
          margin="dense"
          fullWidth
          value={form.name}
          onChange={(e) => set({ name: e.target.value })}
          placeholder="Weekend feast offer"
        />
        <TextField
          select
          label="Channel"
          size="small"
          margin="dense"
          fullWidth
          value={form.channel}
          onChange={(e) => set({ channel: e.target.value as CampaignForm["channel"] })}
        >
          <MenuItem value="EMAIL">Email</MenuItem>
          <MenuItem value="WHATSAPP">WhatsApp</MenuItem>
        </TextField>
      </Box>
      <TextField
        label="Subject / headline"
        size="small"
        margin="dense"
        fullWidth
        value={form.subject}
        onChange={(e) => set({ subject: e.target.value })}
        placeholder="Weekend feast: 20% off all biryanis"
      />
      <TextField
        label="Message (blank line = new paragraph)"
        size="small"
        margin="dense"
        fullWidth
        multiline
        minRows={5}
        value={form.body}
        onChange={(e) => set({ body: e.target.value })}
        placeholder={"Hot deal!\n\nThis weekend only — 20% off every biryani."}
      />
      <Box sx={{ display: "flex", gap: 1.5 }}>
        <TextField
          label="Button label (optional)"
          size="small"
          margin="dense"
          fullWidth
          value={form.ctaLabel}
          onChange={(e) => set({ ctaLabel: e.target.value })}
          placeholder="Order now"
        />
        <TextField
          label="Button link (optional)"
          type="url"
          size="small"
          margin="dense"
          fullWidth
          value={form.ctaUrl}
          onChange={(e) => set({ ctaUrl: e.target.value })}
          placeholder="https://native.didibhaiyakibiryani.com"
        />
      </Box>
      {error ? <Typography color="error" variant="body2" sx={{ mt: 1 }}>{error}</Typography> : null}
    </Modal>
  );
}
