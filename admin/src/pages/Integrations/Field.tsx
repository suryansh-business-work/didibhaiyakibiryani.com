interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "password";
  hint?: string;
}

/** Labelled text/password input used across the Integrations form. */
export default function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  hint,
}: Readonly<FieldProps>) {
  return (
    <div className="field" style={{ minWidth: 220, flex: "1 1 260px" }}>
      <label>{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && (
        <div className="muted" style={{ fontSize: "0.72rem", marginTop: 4 }}>
          {hint}
        </div>
      )}
    </div>
  );
}
