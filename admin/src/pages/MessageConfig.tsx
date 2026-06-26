import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Box, Button, Chip, Paper, Stack, TextField, Tooltip, Typography } from "@mui/material";
import Layout from "../components/Layout";
import { Spinner } from "../components/ui";
import { useAlert } from "../components/dialog";
import { SETTINGS } from "../graphql/queries";
import { UPDATE_SETTINGS } from "../graphql/mutations";
import {
  messageConfig,
  placeholdersFor,
  fillMessageTemplate,
  type MessageKind,
  type MessageSettingsKey,
} from "../constants/messageTemplates";

type SettingsData = { brandName?: string; website?: string } & Partial<Record<MessageSettingsKey, string>>;

const SAMPLE_LINK = "https://didibhaiyakibiryani.com/DDB-1234";

/** Configure one customer-message template (tracking / survey / receipt). Saved
 *  to the matching Settings field so the order "Generate …" action stays dynamic. */
export default function MessageConfig({ kind }: Readonly<{ kind: MessageKind }>) {
  const cfg = messageConfig(kind);
  const { data, loading } = useQuery<{ settings: SettingsData }>(SETTINGS);
  const [save, { loading: saving }] = useMutation(UPDATE_SETTINGS);
  const notify = useAlert();
  const [text, setText] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (data?.settings && !loaded) {
      setText(data.settings[cfg.settingsKey] || cfg.defaultTemplate);
      setLoaded(true);
    }
  }, [data, loaded, cfg]);

  const brandName = data?.settings?.brandName || "Didi Bhaiya ki Biryani";
  const website = data?.settings?.website || "didibhaiyakibiryani.com";
  const preview = fillMessageTemplate(text, cfg, {
    name: "Asha",
    link: SAMPLE_LINK,
    orderNumber: "DDB-1234",
    brandName,
    website,
  });

  async function onSave() {
    try {
      await save({ variables: { input: { [cfg.settingsKey]: text } } });
      await notify({ title: "Saved", message: `${cfg.label} template updated.` });
    } catch (e: unknown) {
      await notify({ title: "Could not save", message: e instanceof Error ? e.message : "Please try again." });
    }
  }

  if (loading && !data) {
    return (
      <Layout title={cfg.label}>
        <Spinner />
      </Layout>
    );
  }

  return (
    <Layout title={cfg.label}>
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
        <Paper sx={{ p: 2.5 }}>
          <Typography variant="h6" gutterBottom>Message template</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Used by the order “Generate {cfg.label.toLowerCase()}” action. Tap a token to insert it.
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1, mb: 2 }}>
            {placeholdersFor(cfg).map((p) => (
              <Tooltip key={p.token} title={p.desc}>
                <Chip label={p.token} size="small" variant="outlined" onClick={() => setText((t) => `${t}${p.token}`)} />
              </Tooltip>
            ))}
          </Stack>
          <TextField value={text} onChange={(e) => setText(e.target.value)} multiline minRows={14} fullWidth size="small" />
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button variant="contained" onClick={onSave} disabled={saving}>{saving ? "Saving…" : "Save template"}</Button>
            <Button color="inherit" onClick={() => setText(cfg.defaultTemplate)}>Reset to default</Button>
          </Stack>
        </Paper>

        <Paper sx={{ p: 2.5 }}>
          <Typography variant="h6" gutterBottom>Preview</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>Sample values filled in.</Typography>
          <Box sx={{ whiteSpace: "pre-wrap", fontSize: "0.9rem", lineHeight: 1.6, p: 2, borderRadius: 1, border: 1, borderColor: "divider", minHeight: 320 }}>
            {preview}
          </Box>
        </Paper>
      </Box>
    </Layout>
  );
}
