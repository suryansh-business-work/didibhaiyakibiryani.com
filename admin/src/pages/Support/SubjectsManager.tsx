import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { SETTINGS } from "../../graphql/queries";
import { UPDATE_SETTINGS } from "../../graphql/mutations";
import { useAlert } from "../../components/dialog";

/** Admin-managed subject lines shown in the customer support box dropdown. */
export default function SubjectsManager() {
  const { data } = useQuery<{ settings: { supportSubjects: string[] } }>(SETTINGS);
  const [save, { loading }] = useMutation(UPDATE_SETTINGS);
  const notify = useAlert();

  const [subjects, setSubjects] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (data?.settings && !dirty) {
      setSubjects(data.settings.supportSubjects ?? []);
    }
  }, [data, dirty]);

  function add() {
    const value = draft.trim();
    if (!value || subjects.includes(value)) return;
    setSubjects((s) => [...s, value]);
    setDraft("");
    setDirty(true);
  }

  function remove(subject: string) {
    setSubjects((s) => s.filter((x) => x !== subject));
    setDirty(true);
  }

  async function persist() {
    try {
      await save({ variables: { input: { supportSubjects: subjects } } });
      setDirty(false);
      await notify({ title: "Saved", message: "Support subjects updated for the apps." });
    } catch (e: unknown) {
      await notify({
        title: "Could not save",
        message: e instanceof Error ? e.message : "Please try again.",
      });
    }
  }

  return (
    <div className="card" style={{ padding: 18, marginBottom: 16 }}>
      <h3 style={{ marginBottom: 6 }}>Support subjects</h3>
      <p className="muted" style={{ fontSize: "0.82rem", marginBottom: 12 }}>
        These appear in the customer app's support dropdown (plus an “Other” custom option).
      </p>
      <div className="chips" style={{ marginBottom: 12 }}>
        {subjects.map((s) => (
          <span key={s} className="chip">
            {s}{" "}
            <button
              style={{ marginLeft: 6, color: "var(--red)" }}
              aria-label={`Remove ${s}`}
              onClick={() => remove(s)}
            >
              ×
            </button>
          </span>
        ))}
        {subjects.length === 0 && <span className="muted">No subjects yet.</span>}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          style={{ flex: 1 }}
          value={draft}
          placeholder="New subject line…"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
        />
        <button className="btn btn-ghost" onClick={add}>
          Add
        </button>
        <button className="btn btn-gold" disabled={loading || !dirty} onClick={persist}>
          {loading ? "Saving…" : "Save subjects"}
        </button>
      </div>
    </div>
  );
}
