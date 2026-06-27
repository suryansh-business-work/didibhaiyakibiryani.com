import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { SETTINGS, MENU_ITEMS } from "../../graphql/queries";
import { UPDATE_SETTINGS } from "../../graphql/mutations";
import Layout from "../../components/Layout";
import { Spinner } from "../../components/ui";
import Switch from "../../components/Switch";
import { useAlert } from "../../components/dialog";
import {
  BLANK_FINANCE,
  DELIVERY_COST_FIELDS,
  settingsToFinanceForm,
  type FinanceForm,
  type FinanceSettingsData,
} from "./types";

interface MenuRef { id: string; name: string }

export default function Finance() {
  const { data, loading } = useQuery<{ settings: FinanceSettingsData }>(SETTINGS);
  const { data: menuData } = useQuery<{ menuItems: MenuRef[] }>(MENU_ITEMS);
  const [save, { loading: saving }] = useMutation(UPDATE_SETTINGS);
  const notify = useAlert();
  const menuItems = menuData?.menuItems ?? [];

  const [form, setForm] = useState<FinanceForm>({ ...BLANK_FINANCE });
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (data?.settings && !dirty) {
      setForm(settingsToFinanceForm(data.settings));
    }
  }, [data, dirty]);

  function patch(p: Partial<FinanceForm>) {
    setForm((f) => ({ ...f, ...p }));
    setDirty(true);
  }

  async function submit() {
    try {
      await save({ variables: { input: form } });
      setDirty(false);
      await notify({ title: "Saved", message: "Finance settings updated everywhere." });
    } catch (e: unknown) {
      await notify({
        title: "Could not save",
        message: e instanceof Error ? e.message : "Please try again.",
      });
    }
  }

  if (loading && !data) {
    return (
      <Layout title="Finance Settings">
        <Spinner />
      </Layout>
    );
  }

  return (
    <Layout title="Finance Settings">
      <div className="card" style={{ padding: 18, marginBottom: 16 }}>
        <h3 style={{ marginBottom: 12 }}>Delivery cost</h3>
        <div className="field-row">
          {DELIVERY_COST_FIELDS.slice(0, 2).map((f) => (
            <NumberField key={f.key} def={f} value={form[f.key]} onChange={patch} />
          ))}
        </div>
        <div className="field-row">
          {DELIVERY_COST_FIELDS.slice(2, 4).map((f) => (
            <NumberField key={f.key} def={f} value={form[f.key]} onChange={patch} />
          ))}
        </div>
        <NumberField def={DELIVERY_COST_FIELDS[4]} value={form.storeLng} onChange={patch} />
        <p className="muted" style={{ fontSize: "0.8rem" }}>
          Fee charged = min delivery cost + per-km charge × distance (store → customer).
          Orders above the free-delivery threshold ship free.
        </p>
      </div>

      <div className="card" style={{ padding: "6px 18px", marginBottom: 16 }}>
        <h3 style={{ margin: "12px 0 4px" }}>Payment options</h3>
        <Switch
          label="Cash on delivery"
          hint="Customers can pay the rider in cash"
          checked={form.codEnabled}
          onChange={(v) => patch({ codEnabled: v })}
        />
        <Switch
          label="Online payment (Razorpay)"
          hint="UPI, cards and netbanking at checkout"
          checked={form.onlineEnabled}
          onChange={(v) => patch({ onlineEnabled: v })}
        />
      </div>

      <div className="card" style={{ padding: "6px 18px", marginBottom: 16 }}>
        <h3 style={{ margin: "12px 0 4px" }}>Loyalty / rewards</h3>
        <Switch
          label="Enable rewards"
          hint="Customers earn points on delivered orders and redeem a free item"
          checked={form.loyaltyEnabled}
          onChange={(v) => patch({ loyaltyEnabled: v })}
        />
        {form.loyaltyEnabled && (
          <>
            <div className="field-row">
              <NumberField def={{ key: "pointsPerOrder", label: "Points per order", hint: "Earned on each eligible order" }} value={form.pointsPerOrder} onChange={patch} />
              <NumberField def={{ key: "pointsMinOrder", label: "Min order to earn (₹)", hint: "Order total needed to earn points" }} value={form.pointsMinOrder} onChange={patch} />
            </div>
            <div className="field-row">
              <NumberField def={{ key: "pointsPerReward", label: "Points per reward", hint: "Points needed to redeem one free item" }} value={form.pointsPerReward} onChange={patch} />
              <div className="field">
                <label>Reward item (free on redeem)</label>
                <select value={form.rewardItem} onChange={(e) => patch({ rewardItem: e.target.value })}>
                  <option value="">— Select an item —</option>
                  {menuItems.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <div className="muted" style={{ fontSize: "0.75rem", marginTop: 4 }}>
                  Redeeming creates a single-use free-item coupon the customer applies at checkout.
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="toolbar">
        <div className="spacer" />
        <button className="btn btn-gold" onClick={submit} disabled={saving || !dirty}>
          {saving ? "Saving…" : "Save finance settings"}
        </button>
      </div>
    </Layout>
  );
}

interface NumberFieldProps {
  def: { key: keyof FinanceForm; label: string; hint?: string; step?: string };
  value: number | string | boolean;
  onChange: (p: Partial<FinanceForm>) => void;
}

function NumberField({ def, value, onChange }: Readonly<NumberFieldProps>) {
  return (
    <div className="field">
      <label>{def.label}</label>
      <input
        type="number"
        step={def.step ?? "1"}
        value={Number(value)}
        onChange={(e) =>
          onChange({ [def.key]: Number(e.target.value) } as Partial<FinanceForm>)
        }
      />
      {def.hint && (
        <div className="muted" style={{ fontSize: "0.75rem", marginTop: 4 }}>
          {def.hint}
        </div>
      )}
    </div>
  );
}
