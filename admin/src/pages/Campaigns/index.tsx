import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { CAMPAIGNS } from "../../graphql/queries";
import { SEND_CAMPAIGN } from "../../graphql/mutations";
import { Button, Chip, type ChipProps, Typography } from "@mui/material";
import Layout from "../../components/Layout";
import { fmtDate } from "../../components/ui";
import { useConfirm } from "../../components/dialog";
import { IPlus } from "../../components/icons";
import { DataTable, useClientTable, type Column } from "../../components/DataTable";
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

  const columns = useMemo<Column<CampaignRow>[]>(() => [
    {
      key: "name", label: "Campaign", sortable: true,
      searchValue: (c) => `${c.name} ${c.subject}`, sortValue: (c) => c.name,
      render: (c) => (
        <>
          <Typography fontWeight={700}>{c.name}</Typography>
          <Typography variant="caption" color="text.secondary">{c.subject}</Typography>
        </>
      ),
    },
    {
      key: "channel", label: "Channel", sortable: true,
      searchValue: (c) => c.channel, sortValue: (c) => c.channel,
      render: (c) => <Typography variant="body2" color="text.secondary">{c.channel}</Typography>,
    },
    {
      key: "status", label: "Status", sortable: true, sortValue: (c) => c.status,
      render: (c) => <Chip size="small" variant="outlined" color={STATUS_COLOR[c.status] ?? "default"} label={c.status} />,
    },
    {
      key: "audienceCount", label: "Audience", sortable: true, sortValue: (c) => c.audienceCount,
      render: (c) => <Typography variant="body2" color="text.secondary">{c.audienceCount}</Typography>,
    },
    {
      key: "sentCount", label: "Sent / Failed", sortable: true, sortValue: (c) => c.sentCount,
      render: (c) => <Typography variant="body2" color="text.secondary">{c.sentCount} / {c.failedCount}</Typography>,
    },
    {
      key: "when", label: "When", sortable: true, sortValue: (c) => c.sentAt ?? c.createdAt,
      render: (c) => <Typography variant="body2" color="text.secondary">{fmtDate(c.sentAt ?? c.createdAt)}</Typography>,
    },
  ], []);

  const { tableProps } = useClientTable(campaigns, columns, { initialSortKey: "when", initialSortDir: "desc" });

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
      <DataTable
        columns={columns}
        rowKey={(c) => c.id}
        loading={loading && !data}
        emptyLabel="No campaigns yet."
        noun="campaign"
        searchPlaceholder="Search campaigns…"
        toolbarEnd={<Button variant="contained" startIcon={<IPlus size={16} />} onClick={() => { setErr(""); setOpen(true); }}>New campaign</Button>}
        {...tableProps}
      />

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
