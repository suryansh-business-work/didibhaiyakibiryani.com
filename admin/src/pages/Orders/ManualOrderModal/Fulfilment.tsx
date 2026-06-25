import { useState } from "react";
import { Controller, type Control, type FieldErrors, type UseFormWatch } from "react-hook-form";
import { Box, Collapse, IconButton, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { RHFSelect, type ManualOrderForm } from "../../../form";
import { STATE_OPTIONS } from "../../../constants/india";
import { inr } from "../../../components/ui";
import type { Rider } from "../types";

type OrderType = "DELIVERY" | "TAKEAWAY";

interface Props {
  control: Control<ManualOrderForm>;
  errors: FieldErrors<ManualOrderForm>;
  watch: UseFormWatch<ManualOrderForm>;
  isDelivery: boolean;
  orderType: OrderType;
  setOrderType: (v: OrderType) => void;
  deliveryFee: number;
  riders: Rider[];
}

/** Fulfilment toggle + a collapsed delivery-address summary (tap to edit) and a
 * read-only delivery fee derived from Finance settings. */
export function Fulfilment({ control, errors, watch, isDelivery, orderType, setOrderType, deliveryFee, riders }: Readonly<Props>) {
  const [editing, setEditing] = useState(false);
  const summary = [watch("line1"), watch("city"), watch("state"), watch("pincode")]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(", ");
  const hasError = Boolean(errors.line1 || errors.city);
  const riderOptions = riders.map((r) => ({ value: r.id, label: r.phone ? `${r.name} · ${r.phone}` : r.name }));
  const riderEmptyLabel = riders.length ? "Assign later" : "No riders yet — add one in Riders";

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
        <Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ cursor: "pointer" }} onClick={() => setEditing((v) => !v)}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary">Delivery address (required)</Typography>
              <Typography variant="body2" noWrap color={hasError && !summary ? "error" : "text.primary"}>
                {summary || "Tap to add address"}
              </Typography>
            </Box>
            <IconButton size="small" aria-label="Edit delivery address">
              <ExpandMoreIcon sx={{ transform: editing ? "rotate(180deg)" : "none", transition: "0.2s" }} />
            </IconButton>
          </Stack>

          <Collapse in={editing}>
            <Stack spacing={1.5} sx={{ mt: 1 }}>
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
              <RHFSelect control={control} name="state" label="State" options={STATE_OPTIONS} error={errors.state?.message} />
            </Stack>
          </Collapse>

          <RHFSelect
            control={control}
            name="deliveryPartner"
            label="Delivery partner"
            options={riderOptions}
            emptyLabel={riderEmptyLabel}
          />

          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">Delivery fee (from settings)</Typography>
            <Typography variant="body2" fontWeight={700}>{inr(deliveryFee)}</Typography>
          </Stack>
        </Box>
      ) : null}
    </Stack>
  );
}
