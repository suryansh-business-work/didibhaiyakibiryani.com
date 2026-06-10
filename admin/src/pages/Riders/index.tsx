import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { RIDERS } from "../../graphql/queries";
import { CREATE_STAFF_USER } from "../../graphql/mutations";
import Layout from "../../components/Layout";
import { AsyncList } from "../../components/ui";
import { IPlus } from "../../components/icons";
import RiderModal from "./RiderModal";
import { BLANK_RIDER, validateRiderForm, type RiderForm, type RiderRow } from "./types";

export default function Riders() {
  const { data, loading, refetch } = useQuery<{ riders: RiderRow[] }>(RIDERS);
  const [createStaff] = useMutation(CREATE_STAFF_USER);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<RiderForm>({ ...BLANK_RIDER });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const riders = data?.riders ?? [];

  function openNew() {
    setForm({ ...BLANK_RIDER });
    setErr("");
    setOpen(true);
  }

  async function save() {
    const problem = validateRiderForm(form);
    if (problem) {
      setErr(problem);
      return;
    }
    setBusy(true);
    setErr("");
    try {
      await createStaff({
        variables: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          password: form.password,
          role: "DELIVERY",
        },
      });
      setOpen(false);
      await refetch();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not create the rider.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout title="Delivery partners">
      <div className="toolbar">
        <p className="muted" style={{ margin: 0 }}>
          Riders sign in on the delivery portal to pick up and deliver assigned orders.
        </p>
        <div className="spacer" />
        <button className="btn btn-gold" onClick={openNew}>
          <IPlus size={16} /> New rider
        </button>
      </div>

      <div className="card">
        <AsyncList
          loading={loading && !data}
          empty={riders.length === 0}
          emptyLabel="No delivery partners yet — create the first one."
        >
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {riders.map((r) => (
                  <tr key={r.id}>
                    <td className="t-strong">{r.name}</td>
                    <td className="muted">{r.email}</td>
                    <td className="muted">{r.phone ?? "—"}</td>
                    <td>
                      <span className={`badge ${r.isActive ? "badge--green" : "badge--muted"}`}>
                        <span className="dot" />
                        {r.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncList>
      </div>

      {open && (
        <RiderModal
          form={form}
          busy={busy}
          error={err}
          onChange={setForm}
          onClose={() => setOpen(false)}
          onSave={save}
        />
      )}
    </Layout>
  );
}
