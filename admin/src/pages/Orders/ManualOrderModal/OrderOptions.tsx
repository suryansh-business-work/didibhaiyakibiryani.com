import { Controller, type Control } from "react-hook-form";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
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
        <Autocomplete
          options={options}
          getOptionLabel={(o) => o.label}
          isOptionEqualToValue={(o, v) => o.value === v.value}
          getOptionDisabled={(o) => (enabledValues ? !enabledValues.has(o.value) : false)}
          value={options.find((o) => o.value === field.value) ?? options[0]}
          onChange={(_, opt) => field.onChange(opt.value)}
          disableClearable
          fullWidth
          size="small"
          renderInput={(params) => <TextField {...params} label={label} onBlur={field.onBlur} />}
        />
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
            render={({ field }) => {
              const couponOpts = coupons.map((c) => ({ value: c.code, label: `${c.code} — ${c.title}` }));
              return (
                <Stack spacing={0.5}>
                  <Autocomplete
                    options={couponOpts}
                    getOptionLabel={(o) => o.label}
                    isOptionEqualToValue={(o, v) => o.value === v.value}
                    value={couponOpts.find((o) => o.value === field.value) ?? null}
                    onChange={(_, opt) => field.onChange(opt ? opt.value : "")}
                    size="small"
                    renderInput={(params) => <TextField {...params} label="Coupon" placeholder="No coupon" onBlur={field.onBlur} />}
                  />
                  <CouponNote coupon={coupons.find((c) => c.code === field.value)} appliedDiscount={appliedDiscount} />
                </Stack>
              );
            }}
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
