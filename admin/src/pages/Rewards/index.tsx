import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { SETTINGS, MENU_ITEMS } from "../../graphql/queries";
import { UPDATE_SETTINGS } from "../../graphql/mutations";
import Layout from "../../components/Layout";
import { Spinner } from "../../components/ui";
import Switch from "../../components/Switch";
import { useAlert } from "../../components/dialog";

interface MenuRef { id: string; name: string }

interface RewardsData {
  loyaltyEnabled: boolean;
  pointsPerOrder: number;
  pointsMinOrder: number;
  pointsPerReward: number;
  rewardName: string;
  rewardItem?: { id: string; name: string } | null;
}

interface RewardsForm {
  loyaltyEnabled: boolean;
  pointsPerOrder: number;
  pointsMinOrder: number;
  pointsPerReward: number;
  rewardName: string;
  rewardItem: string;
}

const BLANK: RewardsForm = {
  loyaltyEnabled: false,
  pointsPerOrder: 100,
  pointsMinOrder: 350,
  pointsPerReward: 600,
  rewardName: "",
  rewardItem: "",
};

function toForm(s: RewardsData): RewardsForm {
  return {
    loyaltyEnabled: s.loyaltyEnabled ?? false,
    pointsPerOrder: s.pointsPerOrder ?? BLANK.pointsPerOrder,
    pointsMinOrder: s.pointsMinOrder ?? BLANK.pointsMinOrder,
    pointsPerReward: s.pointsPerReward ?? BLANK.pointsPerReward,
    rewardName: s.rewardName ?? "",
    rewardItem: s.rewardItem?.id ?? "",
  };
}

function NumField({ label, hint, value, onChange }: Readonly<{ label: string; hint: string; value: number; onChange: (v: number) => void }>) {
  return (
    <div className="field">
      <label>{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <div className="muted" style={{ fontSize: "0.75rem", marginTop: 4 }}>{hint}</div>
    </div>
  );
}

export default function Rewards() {
  const { data, loading } = useQuery<{ settings: RewardsData }>(SETTINGS);
  const { data: menuData } = useQuery<{ menuItems: MenuRef[] }>(MENU_ITEMS);
  const [save, { loading: saving }] = useMutation(UPDATE_SETTINGS);
  const notify = useAlert();
  const menuItems = menuData?.menuItems ?? [];

  const [form, setForm] = useState<RewardsForm>({ ...BLANK });
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (data?.settings && !dirty) {
      setForm(toForm(data.settings));
    }
  }, [data, dirty]);

  function patch(p: Partial<RewardsForm>) {
    setForm((f) => ({ ...f, ...p }));
    setDirty(true);
  }

  async function submit() {
    try {
      await save({ variables: { input: form } });
      setDirty(false);
      await notify({ title: "Saved", message: "Rewards updated everywhere." });
    } catch (e: unknown) {
      await notify({ title: "Could not save", message: e instanceof Error ? e.message : "Please try again." });
    }
  }

  if (loading && !data) {
    return (
      <Layout title="Rewards">
        <Spinner />
      </Layout>
    );
  }

  return (
    <Layout title="Rewards">
      <div className="card" style={{ padding: 18, marginBottom: 16 }}>
        <h3 style={{ marginBottom: 4 }}>Cheesy Rewards</h3>
        <p className="muted" style={{ fontSize: "0.8rem", marginBottom: 10 }}>
          Customers earn points on delivered orders and redeem them for a free item.
          Everything here updates the customer app instantly — no deploy.
        </p>
        <Switch
          label="Enable rewards"
          hint="Turn the whole loyalty programme on or off"
          checked={form.loyaltyEnabled}
          onChange={(v) => patch({ loyaltyEnabled: v })}
        />
        {form.loyaltyEnabled && (
          <>
            <div className="field-row">
              <NumField label="Points per order" hint="Earned on each eligible order" value={form.pointsPerOrder} onChange={(v) => patch({ pointsPerOrder: v })} />
              <NumField label="Min order to earn (₹)" hint="Order total needed to earn points" value={form.pointsMinOrder} onChange={(v) => patch({ pointsMinOrder: v })} />
            </div>
            <div className="field-row">
              <NumField label="Points per reward" hint="Points needed to redeem one reward" value={form.pointsPerReward} onChange={(v) => patch({ pointsPerReward: v })} />
              <div className="field">
                <label>Reward name</label>
                <input value={form.rewardName} onChange={(e) => patch({ rewardName: e.target.value })} placeholder="e.g. Free Regular Pizza" />
                <div className="muted" style={{ fontSize: "0.75rem", marginTop: 4 }}>
                  Shown to customers. Leave blank to use the reward item's own name.
                </div>
              </div>
            </div>
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
          </>
        )}
      </div>

      <div className="toolbar">
        <div className="spacer" />
        <button className="btn btn-gold" onClick={submit} disabled={saving || !dirty}>
          {saving ? "Saving…" : "Save rewards"}
        </button>
      </div>
    </Layout>
  );
}
