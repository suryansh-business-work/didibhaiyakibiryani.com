import { Controller, type Control } from "react-hook-form";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import type { ExpenseForm } from "../../form";

/** MUI date picker bound to the expense form's `date` field. Stores the chosen
 * day as an ISO string (or "" when cleared) so it round-trips to ExpenseInput. */
export default function ExpenseDateField({ control }: Readonly<{ control: Control<ExpenseForm> }>) {
  return (
    <Controller
      control={control}
      name="date"
      render={({ field }) => (
        <DatePicker
          label="Expense date"
          value={field.value ? new Date(field.value) : null}
          onChange={(d) => field.onChange(d instanceof Date && !Number.isNaN(d.getTime()) ? d.toISOString() : "")}
          slotProps={{ textField: { size: "small", fullWidth: true, margin: "dense" } }}
        />
      )}
    />
  );
}
