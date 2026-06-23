import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { Box, Button, Divider, Paper, Stack, Typography } from "@mui/material";
import { inr } from "../../../components/ui";
import { CustomerSelect } from "./CustomerSelect";
import { OrderLines } from "./OrderLines";
import { OrderOptions } from "./OrderOptions";
import type { ManualOrderForm } from "../../../form";
import type { CustomerOption, Totals } from "./types";

type OrderType = "DELIVERY" | "TAKEAWAY";

interface Props {
  control: Control<ManualOrderForm>;
  errors: FieldErrors<ManualOrderForm>;
  watch: UseFormWatch<ManualOrderForm>;
  setValue: UseFormSetValue<ManualOrderForm>;
  customers: CustomerOption[];
  fields: ReadonlyArray<{ id: string }>;
  totals: Totals;
  isDelivery: boolean;
  orderType: OrderType;
  setOrderType: (v: OrderType) => void;
  onQty: (index: number, delta: number) => void;
  onRemove: (index: number) => void;
  onAddCustom: () => void;
  onCreate: () => void;
  isSubmitting: boolean;
  rootError?: string;
}

function Row({ k, v, strong }: Readonly<{ k: string; v: string; strong?: boolean }>) {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography variant="body2" color={strong ? "text.primary" : "text.secondary"} fontWeight={strong ? 800 : 400}>{k}</Typography>
      <Typography variant="body2" color={strong ? "primary" : "text.secondary"} fontWeight={strong ? 800 : 600}>{v}</Typography>
    </Stack>
  );
}

/** The "Current order" panel: customer, line items, options and totals. */
export function OrderPanel(props: Readonly<Props>) {
  const {
    control, errors, watch, setValue, customers, fields, totals,
    isDelivery, orderType, setOrderType, onQty, onRemove, onAddCustom, onCreate, isSubmitting, rootError,
  } = props;
  return (
    <Paper sx={{ width: 400, flexShrink: 0, display: "flex", flexDirection: "column", height: "100%", p: 2 }}>
      <Typography variant="h6" gutterBottom>Current order</Typography>
      <CustomerSelect control={control} errors={errors} watch={watch} setValue={setValue} customers={customers} />
      <Divider sx={{ my: 1.5 }} />
      <Box sx={{ flex: 1, overflowY: "auto", pr: 0.5 }}>
        <OrderLines control={control} errors={errors} fields={fields} watch={watch} onQty={onQty} onRemove={onRemove} />
        <Button size="small" onClick={onAddCustom} sx={{ mt: 1 }}>+ Add custom item</Button>
        <OrderOptions control={control} errors={errors} isDelivery={isDelivery} orderType={orderType} setOrderType={setOrderType} />
      </Box>
      <Divider sx={{ my: 1.5 }} />
      <Stack spacing={0.5}>
        <Row k="Subtotal" v={inr(totals.subtotal)} />
        {totals.discount > 0 ? <Row k="Discount" v={`– ${inr(totals.discount)}`} /> : null}
        {isDelivery ? <Row k="Delivery" v={inr(totals.deliveryFee)} /> : null}
        <Row k="Total" v={inr(totals.total)} strong />
      </Stack>
      {rootError ? <Typography color="error" variant="caption" sx={{ mt: 1 }}>{rootError}</Typography> : null}
      <Button variant="contained" size="large" sx={{ mt: 1.5 }} onClick={onCreate} disabled={isSubmitting}>
        {isSubmitting ? "Creating…" : `Create order · ${inr(totals.total)}`}
      </Button>
    </Paper>
  );
}
