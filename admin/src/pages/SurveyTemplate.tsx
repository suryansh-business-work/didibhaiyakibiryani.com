import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Box, Button, Chip, Paper, Stack, TextField, Tooltip, Typography } from "@mui/material";
import Layout from "../components/Layout";
import { Spinner } from "../components/ui";
import { useAlert } from "../components/dialog";
import { SETTINGS } from "../graphql/queries";
import { UPDATE_SETTINGS } from "../graphql/mutations";
import { DEFAULT_SURVEY_TEMPLATE, SURVEY_PLACEHOLDERS, fillSurveyTemplate } from "../constants/surveyTemplate";

interface SettingsData {
  surveyMessageTemplate?: string;
  brandName?: string;
  website?: string;
}

export default function SurveyTemplate() {
  const { data, loading } = useQuery<{ settings: SettingsData }>(SETTINGS);
  const [save, { loading: saving }] = useMutation(UPDATE_SETTINGS);
  const notify = useAlert();
  const [text, setText] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (data?.settings && !loaded) {
      setText(data.settings.surveyMessageTemplate || DEFAULT_SURVEY_TEMPLATE);
      setLoaded(true);
    }
  }, [data, loaded]);

  const brandName = data?.settings?.brandName || "Didi Bhaiya ki Biryani";
  const website = data?.settings?.website || "didibhaiyakibiryani.com";
  const preview = fillSurveyTemplate(text, {
    name: "Asha",
    surveyLink: `${window.location.origin}/survey/0/sample`,
    orderNumber: "DDB-1234",
    brandName,
    website,
  });

  async function onSave() {
    try {
      await save({ variables: { input: { surveyMessageTemplate: text } } });
      await notify({ title: "Saved", message: "Survey message template updated." });
    } catch (e: unknown) {
      await notify({ title: "Could not save", message: e instanceof Error ? e.message : "Please try again." });
    }
  }

  if (loading && !data) {
    return (
      <Layout title="Survey Message">
        <Spinner />
      </Layout>
    );
  }

  return (
    <Layout title="Survey Message">
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
        <Paper sx={{ p: 2.5 }}>
          <Typography variant="h6" gutterBottom>Message template</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            This is used by the order “Generate survey message” action. Tap a token to insert it.
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1, mb: 2 }}>
            {SURVEY_PLACEHOLDERS.map((p) => (
              <Tooltip key={p.token} title={p.desc}>
                <Chip label={p.token} size="small" variant="outlined" onClick={() => setText((t) => `${t}${p.token}`)} />
              </Tooltip>
            ))}
          </Stack>
          <TextField value={text} onChange={(e) => setText(e.target.value)} multiline minRows={14} fullWidth size="small" />
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button variant="contained" onClick={onSave} disabled={saving}>{saving ? "Saving…" : "Save template"}</Button>
            <Button color="inherit" onClick={() => setText(DEFAULT_SURVEY_TEMPLATE)}>Reset to default</Button>
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
