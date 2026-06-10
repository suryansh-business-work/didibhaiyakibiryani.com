import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { CAMPAIGNS } from "../../graphql/queries";
import { SEND_CAMPAIGN } from "../../graphql/mutations";
import Layout from "../../components/Layout";
import { AsyncList, fmtDate } from "../../components/ui";
import { useConfirm } from "../../components/dialog";
import { IPlus } from "../../components/icons";
import CampaignModal from "./CampaignModal";
import { BLANK_FORM, STATUS_BADGE, type CampaignForm, type CampaignRow } from "./types";

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
      <div className="toolbar">
        <div className="spacer" />
        <button className="btn btn-gold" onClick={() => { setErr(""); setOpen(true); }}>
          <IPlus size={16} /> New campaign
        </button>
      </div>

      <div className="card">
        <AsyncList loading={loading && !data} empty={campaigns.length === 0} emptyLabel="No campaigns yet.">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Campaign</th><th>Channel</th><th>Status</th>
                  <th>Audience</th><th>Sent / Failed</th><th>When</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="t-strong">{c.name}</div>
                      <div className="muted" style={{ fontSize: "0.78rem" }}>{c.subject}</div>
                    </td>
                    <td className="muted">{c.channel}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[c.status] ?? "badge--muted"}`}>
                        <span className="dot" />{c.status}
                      </span>
                    </td>
                    <td className="muted">{c.audienceCount}</td>
                    <td className="muted">{c.sentCount} / {c.failedCount}</td>
                    <td className="muted">{fmtDate(c.sentAt ?? c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
