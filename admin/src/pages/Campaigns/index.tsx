import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { CAMPAIGNS } from "../../graphql/queries";
import { SEND_CAMPAIGN } from "../../graphql/mutations";
import { Box, Button, Chip, type ChipProps, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import Layout from "../../components/Layout";
import { AsyncList, fmtDate } from "../../components/ui";
import { useConfirm } from "../../components/dialog";
import { IPlus } from "../../components/icons";
import CampaignModal from "./CampaignModal";
import { BLANK_FORM, type CampaignForm, type CampaignRow } from "./types";

const STATUS_COLOR: Record<string, ChipProps["color"]> = {
  SENT: "success",
  SENDING: "info",
  FAILED: "error",
  DRAFT: "default",
};

export default function Campaigns() {
  const { data, loading, refetch } = useQuery<{ campaigns: CampaignRow[] }>(CAMPAIGNS, {
    pollInterval: 10000, // live-ish status while a campaign is SENDING
  });
  const [send, { loading: sending }] = useMutation(SEND_CAMPAIGN);
  const confirm = useConfirm();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CampaignForm>({ ...BLANK_FORM });
  const [err, setErr] = useState("");

  const campaigns = data?.campaigns ?? [];

  async function doSend() {
    setErr("");
    if (!form.name.trim() || !form.subject.trim() || !form.body.trim()) {
      setErr("Name, subject and message are required.");
      return;
    }
    const ok = await confirm({
      title: "Send campaign",
      message: `Send "${form.subject}" to ALL customers via ${form.channel === "EMAIL" ? "email" : "WhatsApp"}? This cannot be undone.`,
      confirmLabel: "Send now",
      danger: true,
    });
    if (!ok) return;
    try {
      await send({
        variables: {
          input: {
            name: form.name.trim(),
            channel: form.channel,
            subject: form.subject.trim(),
            body: form.body.trim(),
            ctaLabel: form.ctaLabel.trim() || null,
            ctaUrl: form.ctaUrl.trim() || null,
          },
        },
      });
      setOpen(false);
      setForm({ ...BLANK_FORM });
      await refetch();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not send.");
    }
  }

  return (
    <Layout title="Email & WhatsApp Campaigns">
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button variant="contained" startIcon={<IPlus size={16} />} onClick={() => { setErr(""); setOpen(true); }}>New campaign</Button>
      </Box>

      <div className="card">
        <AsyncList loading={loading && !data} empty={campaigns.length === 0} emptyLabel="No campaigns yet.">
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Campaign</TableCell><TableCell>Channel</TableCell><TableCell>Status</TableCell>
                  <TableCell>Audience</TableCell><TableCell>Sent / Failed</TableCell><TableCell>When</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {campaigns.map((c) => (
                  <TableRow key={c.id} hover>
                    <TableCell>
                      <Typography fontWeight={700}>{c.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{c.subject}</Typography>
                    </TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{c.channel}</Typography></TableCell>
                    <TableCell><Chip size="small" variant="outlined" color={STATUS_COLOR[c.status] ?? "default"} label={c.status} /></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{c.audienceCount}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{c.sentCount} / {c.failedCount}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{fmtDate(c.sentAt ?? c.createdAt)}</Typography></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </AsyncList>
      </div>

      {open && (
        <CampaignModal
          form={form}
          busy={sending}
          error={err}
          onChange={setForm}
          onClose={() => setOpen(false)}
          onSend={doSend}
        />
      )}
    </Layout>
  );
}
