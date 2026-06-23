import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import type { ManualOrderForm } from "../../../form";

type OrderType = "DELIVERY" | "TAKEAWAY";

interface Props {
  control: Control<ManualOrderForm>;
  errors: FieldErrors<ManualOrderForm>;
  isDelivery: boolean;
  orderType: OrderType;
  setOrderType: (v: OrderType) => void;
}

/** Prominent fulfilment + delivery address (required before creating the order). */
export function Fulfilment({ control, errors, isDelivery, orderType, setOrderType }: Readonly<Props>) {
  return (
    <Stack spacing={1.5}>
      <ToggleButtonGroup
        size="small"
        exclusive
        fullWidth
        value={orderType}
        onChange={(_, v) => {
          if (v) setOrderType(v);
        }}
      >
        <ToggleButton value="TAKEAWAY">Takeaway</ToggleButton>
        <ToggleButton value="DELIVERY">Delivery</ToggleButton>
      </ToggleButtonGroup>

      {isDelivery ? (
        <>
          <Typography variant="caption" color="text.secondary">Delivery address (required)</Typography>
          <Controller
            control={control}
            name="line1"
            render={({ field }) => (
              <TextField {...field} value={field.value ?? ""} label="Address line 1" size="small" required error={Boolean(errors.line1)} helperText={errors.line1?.message} />
            )}
          />
          <Stack direction="row" spacing={1}>
            <Controller
              control={control}
              name="city"
              render={({ field }) => (
                <TextField {...field} value={field.value ?? ""} label="City" size="small" fullWidth required error={Boolean(errors.city)} helperText={errors.city?.message} />
              )}
            />
            <Controller
              control={control}
              name="pincode"
              render={({ field }) => <TextField {...field} value={field.value ?? ""} label="Pincode" size="small" fullWidth />}
            />
          </Stack>
          <Controller
            control={control}
            name="deliveryFee"
            render={({ field }) => <TextField {...field} value={field.value ?? ""} label="Delivery fee (₹)" type="number" size="small" />}
          />
        </>
      ) : null}
    </Stack>
  );
}
