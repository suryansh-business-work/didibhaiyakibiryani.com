import type { SectionDef, SettingsForm } from "./types";

interface BrandingSectionProps {
  section: SectionDef;
  form: SettingsForm;
  onChange: (patch: Partial<SettingsForm>) => void;
}

export default function BrandingSection({
  section,
  form,
  onChange,
}: Readonly<BrandingSectionProps>) {
  return (
    <div className="card" style={{ padding: 20, marginBottom: 16 }}>
      <div className="panel-title">{section.title}</div>
      <div className="field-row" style={{ flexWrap: "wrap" }}>
        {section.fields.map((f) => (
          <div className="field" key={f.key} style={{ minWidth: 220, flex: "1 1 260px" }}>
            <label htmlFor={`branding-${f.key}`}>{f.label}</label>
            {f.type === "color" ? (
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  id={`branding-${f.key}`}
                  type="color"
                  value={form[f.key] || "#000000"}
                  onChange={(e) => onChange({ [f.key]: e.target.value })}
                  style={{ width: 46, height: 38, padding: 2, cursor: "pointer" }}
                />
                <input
                  aria-label={`${f.label} hex value`}
                  value={form[f.key]}
                  onChange={(e) => onChange({ [f.key]: e.target.value })}
                  placeholder="#e4b65c"
                  style={{ flex: 1 }}
                />
              </div>
            ) : (
              <input
                id={`branding-${f.key}`}
                type={f.type ?? "text"}
                value={form[f.key]}
                onChange={(e) => onChange({ [f.key]: e.target.value })}
                placeholder={f.placeholder}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
