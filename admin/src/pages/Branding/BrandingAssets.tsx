import ImageUpload from "../../components/ImageUpload";
import { BRANDING_ASSETS, type SettingsForm } from "./types";

interface BrandingAssetsProps {
  form: SettingsForm;
  onChange: (patch: Partial<SettingsForm>) => void;
}

/** Grid of ImageKit-backed uploads for every brand asset (logos, favicon, icons). */
export default function BrandingAssets({ form, onChange }: Readonly<BrandingAssetsProps>) {
  return (
    <div className="card" style={{ padding: 18, marginBottom: 16 }}>
      <h3 style={{ marginBottom: 6 }}>Logos &amp; app assets</h3>
      <p className="muted" style={{ marginBottom: 16 }}>
        Upload once — each asset is stored on the ImageKit CDN and used everywhere
        (website, apps, emails) at the right size automatically.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {BRANDING_ASSETS.map((a) => (
          <ImageUpload
            key={a.key}
            label={`${a.label} — ${a.hint}`}
            folder="/branding"
            currentUrl={form[a.key]}
            onUploaded={(url) => onChange({ [a.key]: url })}
          />
        ))}
      </div>
    </div>
  );
}
