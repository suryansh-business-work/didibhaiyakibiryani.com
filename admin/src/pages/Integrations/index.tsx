import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { INTEGRATION_SETTINGS } from "../../graphql/queries";
import { UPDATE_INTEGRATION_SETTINGS } from "../../graphql/mutations";
import Layout from "../../components/Layout";
import { Spinner } from "../../components/ui";
import { useAlert } from "../../components/dialog";
import Field from "./Field";
import {
  BLANK_INTEGRATION,
  toIntegrationForm,
  type IntegrationData,
  type IntegrationForm,
} from "./types";

function Badge({ ok }: Readonly<{ ok: boolean }>) {
  return (
    <span
      className="pill"
      style={{
        background: ok ? "rgba(95,180,95,0.15)" : "rgba(224,88,75,0.15)",
        color: ok ? "#5fb45f" : "#e0584b",
        padding: "3px 10px",
        borderRadius: 999,
        fontSize: "0.74rem",
        fontWeight: 700,
      }}
    >
      {ok ? "Configured" : "Not configured"}
    </span>
  );
}

export default function Integrations() {
  const { data, loading } = useQuery<{ integrationSettings: IntegrationData }>(INTEGRATION_SETTINGS);
  const [save, { loading: saving }] = useMutation(UPDATE_INTEGRATION_SETTINGS, {
    refetchQueries: [{ query: INTEGRATION_SETTINGS }],
  });
  const notify = useAlert();
  const [form, setForm] = useState<IntegrationForm>({ ...BLANK_INTEGRATION });
  const [dirty, setDirty] = useState(false);
  const d = data?.integrationSettings;

  useEffect(() => {
    if (d && !dirty) setForm(toIntegrationForm(d));
  }, [d, dirty]);

  function patch(p: Partial<IntegrationForm>) {
    setForm((f) => ({ ...f, ...p }));
    setDirty(true);
  }

  async function submit() {
    try {
      await save({ variables: { input: form } });
      setDirty(false);
      await notify({ title: "Saved", message: "Integration credentials updated." });
    } catch (e: unknown) {
      await notify({
        title: "Could not save",
        message: e instanceof Error ? e.message : "Please try again.",
      });
    }
  }

  if (loading && !data) {
    return (
      <Layout title="Integrations">
        <Spinner />
      </Layout>
    );
  }

  const smtpKept = Boolean(d?.smtpPassSet) ? "•••••••• saved — leave blank to keep" : "";
  const ikKept = Boolean(d?.imagekitPrivateKeySet) ? "•••••••• saved — leave blank to keep" : "";

  return (
    <Layout title="Integrations">
      <p className="muted" style={{ marginBottom: 16 }}>
        Enter the API keys for email and image hosting here. Secrets are stored securely
        and never shown again — leave a secret field blank to keep the saved value.
      </p>

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div className="panel-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          Email (SMTP) <Badge ok={Boolean(d?.smtpConfigured)} />
        </div>
        <div className="field-row" style={{ flexWrap: "wrap" }}>
          <Field label="SMTP host" value={form.smtpHost} onChange={(v) => patch({ smtpHost: v })} placeholder="smtp.gmail.com" />
          <Field label="SMTP port" value={form.smtpPort} onChange={(v) => patch({ smtpPort: v })} placeholder="587" />
          <Field label="SMTP user" value={form.smtpUser} onChange={(v) => patch({ smtpUser: v })} placeholder="you@domain.com" />
          <Field label="SMTP password" type="password" value={form.smtpPass} onChange={(v) => patch({ smtpPass: v })} placeholder={smtpKept} hint="App password / API key" />
          <Field label="From address" value={form.mailFrom} onChange={(v) => patch({ mailFrom: v })} placeholder="no-reply@didibhaiyakibiryani.com" />
          <Field label="From name" value={form.mailFromName} onChange={(v) => patch({ mailFromName: v })} placeholder="Didi Bhaiya ki Biryani" />
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div className="panel-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          ImageKit (media CDN) <Badge ok={Boolean(d?.imagekitConfigured)} />
        </div>
        <div className="field-row" style={{ flexWrap: "wrap" }}>
          <Field label="URL endpoint" value={form.imagekitUrlEndpoint} onChange={(v) => patch({ imagekitUrlEndpoint: v })} placeholder="https://ik.imagekit.io/your_id" />
          <Field label="Public key" value={form.imagekitPublicKey} onChange={(v) => patch({ imagekitPublicKey: v })} placeholder="public_xxx" />
          <Field label="Private key" type="password" value={form.imagekitPrivateKey} onChange={(v) => patch({ imagekitPrivateKey: v })} placeholder={ikKept} hint="Server-side secret" />
        </div>
      </div>

      <div className="toolbar">
        <div className="spacer" />
        <button className="btn btn-gold" onClick={submit} disabled={saving || !dirty}>
          {saving ? "Saving…" : "Save credentials"}
        </button>
      </div>
    </Layout>
  );
}
