import { type UseFormWatch } from "react-hook-form";
import { Box, Chip, IconButton, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RedeemIcon from "@mui/icons-material/Redeem";
import { inr } from "../../../components/ui";
import type { ManualOrderForm } from "../../../form";

interface Props {
  fields: ReadonlyArray<{ id: string }>;
  watch: UseFormWatch<ManualOrderForm>;
  onQty: (index: number, delta: number) => void;
  onRemove: (index: number) => void;
  onToggleComplimentary: (index: number) => void;
}

/** The current order's line items (read-only name + price) each with a qty
 * stepper and remove. Items are added from the catalogue, not typed in. */
export function OrderLines({ fields, watch, onQty, onRemove, onToggleComplimentary }: Readonly<Props>) {
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
        const free = Boolean(line?.complimentary);
        return (
          <Stack key={f.id} direction="row" alignItems="center" spacing={0.5} sx={{ pt: 1 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={700} noWrap>{line?.name}</Typography>
              <Typography variant="caption" color={free ? "success.main" : "text.secondary"} sx={{ textDecoration: free ? "line-through" : "none" }}>
                {free ? `${inr(Number(line?.price) || 0)} · Free` : inr(Number(line?.price) || 0)}
              </Typography>
            </Box>
            <Chip
              size="small"
              icon={<RedeemIcon fontSize="small" />}
              label="Free"
              color={free ? "success" : "default"}
              variant={free ? "filled" : "outlined"}
              onClick={() => onToggleComplimentary(i)}
            />
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
