interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}

/** Accessible toggle switch (checkbox semantics, switch visuals). */
export default function Switch({
  checked,
  onChange,
  label,
  hint,
  disabled,
}: Readonly<SwitchProps>) {
  return (
    <label className={`switch-row ${disabled ? "switch-row--disabled" : ""}`}>
      <span>
        <span className="switch-label">{label}</span>
        {hint && <span className="switch-hint">{hint}</span>}
      </span>
      <span className={`switch ${checked ? "switch--on" : ""}`}>
        <input
          type="checkbox"
          role="switch"
          aria-checked={checked}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="switch__thumb" />
      </span>
    </label>
  );
}
