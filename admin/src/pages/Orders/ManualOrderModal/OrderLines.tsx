import { Controller, type Control, type FieldErrors, type UseFormWatch } from "react-hook-form";
import { Box, IconButton, Stack, TextField, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { inr } from "../../../components/ui";
import type { ManualOrderForm } from "../../../form";

interface Props {
  control: Control<ManualOrderForm>;
  errors: FieldErrors<ManualOrderForm>;
  fields: ReadonlyArray<{ id: string }>;
  watch: UseFormWatch<ManualOrderForm>;
  onQty: (index: number, delta: number) => void;
  onRemove: (index: number) => void;
}

/** The current order's line items, each with a qty stepper + remove. Custom
 * (off-menu) lines expose editable name/price fields. */
export function OrderLines({ control, errors, fields, watch, onQty, onRemove }: Readonly<Props>) {
  if (fields.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
        No items yet — tap a dish to add it.
      </Typography>
    );
  }
  return (
    <Stack divider={<Box sx={{ borderBottom: 1, borderColor: "divider" }} />} spacing={1}>
      {fields.map((f, i) => {
        const line = watch(`items.${i}`);
        const isCustom = !line?.menuItemId;
        const lineErr = errors.items?.[i];
        return (
          <Stack key={f.id} direction="row" alignItems="center" spacing={0.5} sx={{ pt: 1 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {isCustom ? (
                <Stack direction="row" spacing={1}>
                  <Controller
                    control={control}
                    name={`items.${i}.name`}
                    render={({ field }) => (
                      <TextField {...field} value={field.value ?? ""} placeholder="Custom item" variant="standard" error={Boolean(lineErr?.name)} />
                    )}
                  />
                  <Controller
                    control={control}
                    name={`items.${i}.price`}
                    render={({ field }) => (
                      <TextField {...field} value={field.value ?? ""} placeholder="₹" type="number" variant="standard" sx={{ width: 72 }} error={Boolean(lineErr?.price)} />
                    )}
                  />
                </Stack>
              ) : (
                <>
                  <Typography variant="body2" fontWeight={700} noWrap>{line?.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{inr(Number(line?.price) || 0)}</Typography>
                </>
              )}
            </Box>
            <IconButton size="small" onClick={() => onQty(i, -1)} aria-label="Decrease quantity">
              <RemoveIcon fontSize="inherit" />
            </IconButton>
            <Typography fontWeight={800} sx={{ minWidth: 18, textAlign: "center" }}>{line?.qty ?? 0}</Typography>
            <IconButton size="small" onClick={() => onQty(i, 1)} aria-label="Increase quantity">
              <AddIcon fontSize="inherit" />
            </IconButton>
            <IconButton size="small" color="error" onClick={() => onRemove(i)} aria-label="Remove item">
              <DeleteOutlineIcon fontSize="inherit" />
            </IconButton>
          </Stack>
        );
      })}
    </Stack>
  );
}
