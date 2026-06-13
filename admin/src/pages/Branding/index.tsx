import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { SETTINGS } from "../../graphql/queries";
import { UPDATE_SETTINGS } from "../../graphql/mutations";
import Layout from "../../components/Layout";
import { Spinner } from "../../components/ui";
import { useAlert } from "../../components/dialog";
import BrandingSection from "./BrandingSection";
import BrandingAssets from "./BrandingAssets";
import { BLANK_FORM, SECTIONS, settingsToForm, type SettingsData, type SettingsForm } from "./types";

export default function Branding() {
  const { data, loading } = useQuery<{ settings: SettingsData }>(SETTINGS);
  const [save, { loading: saving }] = useMutation(UPDATE_SETTINGS);
  const notify = useAlert();

  const [form, setForm] = useState<SettingsForm>({ ...BLANK_FORM });
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (data?.settings && !dirty) {
      setForm(settingsToForm(data.settings));
    }
  }, [data, dirty]);

  function patch(p: Partial<SettingsForm>) {
    setForm((f) => ({ ...f, ...p }));
    setDirty(true);
  }

  async function submit() {
    try {
      await save({ variables: { input: form } });
      setDirty(false);
      await notify({ title: "Saved", message: "Branding settings updated everywhere." });
    } catch (e: unknown) {
      await notify({
        title: "Could not save",
        message: e instanceof Error ? e.message : "Please try again.",
      });
    }
  }

  if (loading && !data) {
    return (
      <Layout title="Branding">
        <Spinner />
      </Layout>
    );
  }

  return (
    <Layout title="Branding & Company">
      <p className="muted" style={{ marginBottom: 16 }}>
        These settings drive the website, customer app and emails — logo, colors and
        company details update everywhere without a deploy.
      </p>

      <BrandingAssets form={form} onChange={patch} />

      {SECTIONS.map((s) => (
        <BrandingSection key={s.title} section={s} form={form} onChange={patch} />
      ))}

      <div className="toolbar">
        <div className="spacer" />
        <button className="btn btn-gold" onClick={submit} disabled={saving || !dirty}>
          {saving ? "Saving…" : "Save settings"}
        </button>
      </div>
    </Layout>
  );
}
