import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { SETTINGS } from "../../graphql/queries";
import { UPDATE_SETTINGS } from "../../graphql/mutations";
import Layout from "../../components/Layout";
import { Spinner } from "../../components/ui";
import Switch from "../../components/Switch";
import { useAlert } from "../../components/dialog";
import {
  BLANK_STORE,
  MAINTENANCE_APPS,
  settingsToStoreForm,
  type StoreForm,
  type StoreSettingsData,
} from "./types";

export default function Store() {
  const { data, loading, refetch } = useQuery<{ settings: StoreSettingsData }>(SETTINGS);
  const [save, { loading: saving }] = useMutation(UPDATE_SETTINGS);
  const notify = useAlert();

  const [form, setForm] = useState<StoreForm>({ ...BLANK_STORE });
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (data?.settings && !dirty) {
      setForm(settingsToStoreForm(data.settings));
    }
  }, [data, dirty]);

  function patch(p: Partial<StoreForm>) {
    setForm((f) => ({ ...f, ...p }));
    setDirty(true);
  }

  function patchMaintenance(app: string, value: boolean) {
    setForm((f) => ({ ...f, maintenance: { ...f.maintenance, [app]: value } }));
    setDirty(true);
  }

  async function submit() {
    try {
      const cleanedMaintenance: Record<string, boolean> = {};
      for (const app of ["website", "server", "admin", "native", "delivery"]) {
        cleanedMaintenance[app] = form.maintenance[app as keyof typeof form.maintenance];
      }
      await save({ variables: { input: { ...form, maintenance: cleanedMaintenance } } });
      setDirty(false);
      await refetch();
      await notify({ title: "Saved", message: "Store settings updated everywhere." });
    } catch (e: unknown) {
      await notify({
        title: "Could not save",
        message: e instanceof Error ? e.message : "Please try again.",
      });
    }
  }

  if (loading && !data) {
    return (
      <Layout title="Store">
        <Spinner />
      </Layout>
    );
  }

  const openNow = data?.settings?.storeOpenNow ?? true;

  return (
    <Layout title="Store">
      <p className="muted" style={{ marginBottom: 16 }}>
        Opening hours control when customers can place orders; maintenance switches take a
        whole app offline with a friendly message.
      </p>

      <div className="card" style={{ padding: 18, marginBottom: 16 }}>
        <div className="row-between" style={{ marginBottom: 12 }}>
          <h3>Store hours</h3>
          <span className={`badge ${openNow ? "badge--green" : "badge--red"}`}>
            <span className="dot" />
            {openNow ? "Open now" : "Closed now"}
          </span>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Opens at</label>
            <input
              type="time"
              value={form.storeOpenTime}
              onChange={(e) => patch({ storeOpenTime: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Closes at</label>
            <input
              type="time"
              value={form.storeCloseTime}
              onChange={(e) => patch({ storeCloseTime: e.target.value })}
            />
          </div>
        </div>
        <div className="field">
          <label>Timezone (IANA)</label>
          <input
            value={form.storeTimezone}
            placeholder="Asia/Kolkata"
            onChange={(e) => patch({ storeTimezone: e.target.value })}
          />
        </div>
        <p className="muted" style={{ fontSize: "0.8rem" }}>
          Overnight windows are supported (e.g. 18:00 → 02:00). Orders outside these hours
          are politely refused.
        </p>
      </div>

      <div className="card" style={{ padding: "6px 18px", marginBottom: 16 }}>
        <h3 style={{ margin: "12px 0 4px" }}>Maintenance mode</h3>
        {MAINTENANCE_APPS.map((app) => (
          <Switch
            key={app.key}
            label={app.label}
            hint={app.hint}
            checked={form.maintenance[app.key]}
            onChange={(v) => patchMaintenance(app.key, v)}
          />
        ))}
      </div>

      <div className="toolbar">
        <div className="spacer" />
        <button className="btn btn-gold" onClick={submit} disabled={saving || !dirty}>
          {saving ? "Saving…" : "Save store settings"}
        </button>
      </div>
    </Layout>
  );
}
