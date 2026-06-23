import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { Checkbox, FormControlLabel, TextField } from "@mui/material";

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
          margin="dense"
        />
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
