import { Autocomplete, Box, TextField, Typography } from "@mui/material";
import { Modal, FormActions } from "../../components/ui";
import type { CampaignForm } from "./types";

const CHANNELS: ReadonlyArray<{ value: CampaignForm["channel"]; label: string }> = [
  { value: "EMAIL", label: "Email" },
  { value: "WHATSAPP", label: "WhatsApp" },
];

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
        <Autocomplete
          options={CHANNELS}
          getOptionLabel={(o) => o.label}
          isOptionEqualToValue={(o, v) => o.value === v.value}
          value={CHANNELS.find((o) => o.value === form.channel) ?? CHANNELS[0]}
          onChange={(_, opt) => set({ channel: (opt ?? CHANNELS[0]).value })}
          disableClearable
          fullWidth
          size="small"
          renderInput={(params) => <TextField {...params} label="Channel" margin="dense" />}
        />
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
