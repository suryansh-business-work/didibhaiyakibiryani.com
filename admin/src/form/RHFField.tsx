import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";

interface RHFFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  error?: string;
  type?: "text" | "email" | "password" | "tel" | "number" | "url";
  placeholder?: string;
  disabled?: boolean;
  hint?: string;
  autoComplete?: string;
  multiline?: boolean;
}

/** A react-hook-form-bound input that renders an inline error under the field. */
export function RHFField<T extends FieldValues>({
  control,
  name,
  label,
  error,
  type = "text",
  placeholder,
  disabled,
  hint,
  autoComplete,
  multiline,
}: Readonly<RHFFieldProps<T>>) {
  const errorStyle = error ? { borderColor: "var(--red)" } : undefined;
  return (
    <div className="field">
      <label>{label}</label>
      <Controller
        control={control}
        name={name}
        render={({ field }) =>
          multiline ? (
            <textarea
              placeholder={placeholder}
              disabled={disabled}
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value)}
              onBlur={field.onBlur}
              style={errorStyle}
            />
          ) : (
            <input
              type={type}
              placeholder={placeholder}
              disabled={disabled}
              autoComplete={autoComplete}
              value={field.value ?? ""}
              onChange={(e) => field.onChange(e.target.value)}
              onBlur={field.onBlur}
              style={errorStyle}
            />
          )
        }
      />
      {hint && !error ? <div className="field-hint">{hint}</div> : null}
      {error ? <div className="field-error">{error}</div> : null}
    </div>
  );
}

interface RHFCheckboxProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
}

/** A react-hook-form-bound checkbox. */
export function RHFCheckbox<T extends FieldValues>({ control, name, label }: Readonly<RHFCheckboxProps<T>>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <label className="check">
          <input type="checkbox" checked={Boolean(field.value)} onChange={(e) => field.onChange(e.target.checked)} /> {label}
        </label>
      )}
    />
  );
}
