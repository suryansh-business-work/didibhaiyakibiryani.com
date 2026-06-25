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
import { inr } from "../../../components/ui";
import type { ManualOrderForm } from "../../../form";
import { ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES, type CouponOption } from "./types";
import { NEXT } from "../types";

interface SelectFieldProps {
  control: Control<ManualOrderForm>;
  name: "paymentMethod" | "paymentStatus" | "status";
  label: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  enabledValues?: ReadonlySet<string>;
}

function SelectField({ control, name, label, options, enabledValues }: Readonly<SelectFieldProps>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <TextField {...field} value={field.value ?? ""} select label={label} size="small" fullWidth>
          {options.map((o) => (
            <MenuItem key={o.value} value={o.value} disabled={enabledValues ? !enabledValues.has(o.value) : false}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  );
}

interface Props {
  control: Control<ManualOrderForm>;
  baseStatus: string;
  coupons: CouponOption[];
  appliedDiscount: number;
}

function CouponNote({ coupon, appliedDiscount }: Readonly<{ coupon?: CouponOption; appliedDiscount: number }>) {
  if (appliedDiscount > 0) {
    return <Typography variant="caption" color="success.main">– {inr(appliedDiscount)} discount applied</Typography>;
  }
  if (coupon?.type === "FREE_DELIVERY") {
    return <Typography variant="caption" color="success.main">Free delivery applied</Typography>;
  }
  if (coupon) {
    return <Typography variant="caption" color="text.secondary">No discount yet (min order not met, or a free-item coupon).</Typography>;
  }
  return null;
}

/** Collapsible extras: coupon, payment, status, back-date and survey link.
 * The status select only enables the current step + its allowed next steps so
 * an order can't jump straight to a later status. */
export function OrderOptions({ control, baseStatus, coupons, appliedDiscount }: Readonly<Props>) {
  const enabledStatuses = new Set<string>([baseStatus, ...(NEXT[baseStatus] ?? [])]);
  return (
    <Accordion disableGutters sx={{ mt: 1, bgcolor: "transparent" }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography fontWeight={700}>More options</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={1.5}>
          <Controller
            control={control}
            name="couponCode"
            render={({ field }) => (
              <Stack spacing={0.5}>
                <TextField {...field} value={field.value ?? ""} select label="Coupon" size="small">
                  <MenuItem value="">No coupon</MenuItem>
                  {coupons.map((c) => (
                    <MenuItem key={c.id} value={c.code}>{c.code} — {c.title}</MenuItem>
                  ))}
                </TextField>
                <CouponNote coupon={coupons.find((c) => c.code === field.value)} appliedDiscount={appliedDiscount} />
              </Stack>
            )}
          />

          <Stack direction="row" spacing={1}>
            <SelectField control={control} name="paymentMethod" label="Payment" options={PAYMENT_METHODS} />
            <SelectField control={control} name="paymentStatus" label="Pay status" options={PAYMENT_STATUSES} />
          </Stack>
          <SelectField control={control} name="status" label="Order status" options={ORDER_STATUSES} enabledValues={enabledStatuses} />

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
