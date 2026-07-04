import type { SectionDef, SettingsForm } from "./types";

type Field = SectionDef["fields"][number];

interface BrandingSectionProps {
  section: SectionDef;
  form: SettingsForm;
  onChange: (patch: Partial<SettingsForm>) => void;
}

function FieldControl({ field, value, onChange }: Readonly<{ field: Field; value: string; onChange: (v: string) => void }>) {
  const id = `branding-${field.key}`;
  if (field.type === "color") {
    return (
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <input id={id} type="color" value={value || "#000000"} onChange={(e) => onChange(e.target.value)} style={{ width: 46, height: 38, padding: 2, cursor: "pointer" }} />
        <input aria-label={`${field.label} hex value`} value={value} onChange={(e) => onChange(e.target.value)} placeholder="#e4b65c" style={{ flex: 1 }} />
      </div>
    );
  }
  if (field.type === "select") {
    return (
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {(field.options ?? []).map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  }
  return (
    <input id={id} type={field.type ?? "text"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} />
  );
}

export default function BrandingSection({ section, form, onChange }: Readonly<BrandingSectionProps>) {
  return (
    <div className="card" style={{ padding: 20, marginBottom: 16 }}>
      <div className="panel-title">{section.title}</div>
      <div className="field-row" style={{ flexWrap: "wrap" }}>
        {section.fields.map((f) => (
          <div className="field" key={f.key} style={{ minWidth: 220, flex: "1 1 260px" }}>
            <label htmlFor={`branding-${f.key}`}>{f.label}</label>
            <FieldControl field={f} value={form[f.key]} onChange={(v) => onChange({ [f.key]: v })} />
          </div>
        ))}
      </div>
    </div>
  );
}
