import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { Checkbox, FormControlLabel, MenuItem, TextField } from "@mui/material";

type FieldMargin = "none" | "dense" | "normal";

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
  /** Defaults to "dense"; pass "none" when the parent controls spacing (e.g. a Stack gap). */
  margin?: FieldMargin;
}

/** A react-hook-form-bound MUI text field with an inline error/hint. */
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
  margin = "dense",
}: Readonly<RHFFieldProps<T>>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <TextField
          {...field}
          value={field.value ?? ""}
          label={label}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          multiline={multiline}
          minRows={multiline ? 3 : undefined}
          error={Boolean(error)}
          helperText={error ?? hint}
          fullWidth
          size="small"
          margin={margin}
        />
      )}
    />
  );
}

interface RHFSelectProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  error?: string;
  disabled?: boolean;
  emptyLabel?: string;
  /** Defaults to "dense"; pass "none" when the parent controls spacing (e.g. a Stack gap). */
  margin?: FieldMargin;
}

/** A react-hook-form-bound MUI select with an inline error. */
export function RHFSelect<T extends FieldValues>({ control, name, label, options, error, disabled, emptyLabel = "—", margin = "dense" }: Readonly<RHFSelectProps<T>>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <TextField
          {...field}
          value={field.value ?? ""}
          select
          label={label}
          error={Boolean(error)}
          helperText={error}
          disabled={disabled}
          fullWidth
          size="small"
          margin={margin}
        >
          <MenuItem value="">{emptyLabel}</MenuItem>
          {options.map((o) => (
            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
          ))}
        </TextField>
      )}
    />
  );
}

interface RHFCheckboxProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
}

/** A react-hook-form-bound MUI checkbox. */
export function RHFCheckbox<T extends FieldValues>({ control, name, label }: Readonly<RHFCheckboxProps<T>>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FormControlLabel
          control={<Checkbox checked={Boolean(field.value)} onChange={(e) => field.onChange(e.target.checked)} />}
          label={label}
        />
      )}
    />
  );
}
