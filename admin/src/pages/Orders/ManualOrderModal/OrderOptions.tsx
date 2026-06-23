import { Controller, type Control } from "react-hook-form";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import type { ManualOrderForm } from "../../../form";
import { ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES } from "./types";

interface SelectFieldProps {
  control: Control<ManualOrderForm>;
  name: "paymentMethod" | "paymentStatus" | "status";
  label: string;
  options: ReadonlyArray<{ value: string; label: string }>;
}

function SelectField({ control, name, label, options }: Readonly<SelectFieldProps>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <TextField {...field} value={field.value ?? ""} select label={label} size="small" fullWidth>
          {options.map((o) => (
            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
          ))}
        </TextField>
      )}
    />
  );
}

interface Props {
  control: Control<ManualOrderForm>;
}

/** Collapsible extras: discount, payment, status, back-date and survey link. */
export function OrderOptions({ control }: Readonly<Props>) {
  return (
    <Accordion disableGutters sx={{ mt: 1, bgcolor: "transparent" }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography fontWeight={700}>More options</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={1.5}>
          <Controller
            control={control}
            name="discount"
            render={({ field }) => <TextField {...field} value={field.value ?? ""} label="Discount (₹)" type="number" size="small" />}
          />

          <Stack direction="row" spacing={1}>
            <SelectField control={control} name="paymentMethod" label="Payment" options={PAYMENT_METHODS} />
            <SelectField control={control} name="paymentStatus" label="Pay status" options={PAYMENT_STATUSES} />
          </Stack>
          <SelectField control={control} name="status" label="Order status" options={ORDER_STATUSES} />

          <Controller
            control={control}
            name="placedAt"
            render={({ field }) => (
              <DateTimePicker
                label="Order date (back-date)"
                value={field.value ? new Date(field.value) : null}
                onChange={(d) => field.onChange(d instanceof Date && !Number.isNaN(d.getTime()) ? d.toISOString() : "")}
                slotProps={{ textField: { size: "small", fullWidth: true } }}
              />
            )}
          />

          <Controller
            control={control}
            name="surveyUrl"
            render={({ field }) => <TextField {...field} value={field.value ?? ""} label="Feedback survey link" size="small" placeholder="https://forms.gle/…" />}
          />
          <Controller
            control={control}
            name="notes"
            render={({ field }) => <TextField {...field} value={field.value ?? ""} label="Notes" size="small" multiline minRows={2} />}
          />
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
