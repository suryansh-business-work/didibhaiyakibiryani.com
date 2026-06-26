import { Button, Card, CardContent, Divider, Stack, Typography } from "@mui/material";
import type { SurveyItem } from "./graphql";
import { inr } from "./components";

interface OrderSummaryProps {
  items: SurveyItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  receiptUrl: string;
}

/** A label + value row in the totals breakdown. */
function TotalRow({
  label,
  value,
  strong = false,
}: Readonly<{ label: string; value: string; strong?: boolean }>) {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography variant={strong ? "body1" : "body2"} fontWeight={strong ? 800 : 400} color={strong ? "text.primary" : "text.secondary"}>
        {label}
      </Typography>
      <Typography variant={strong ? "body1" : "body2"} fontWeight={strong ? 800 : 400} color={strong ? "primary" : "text.primary"}>
        {value}
      </Typography>
    </Stack>
  );
}

/** Read-only recap of the order: line items, full totals breakdown + receipt download. */
export default function OrderSummary({
  items,
  subtotal,
  discount,
  deliveryFee,
  total,
  receiptUrl,
}: Readonly<OrderSummaryProps>) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography fontWeight={700} gutterBottom>
          Your order
        </Typography>
        <Stack spacing={0.5}>
          {items.map((it) => (
            <Stack key={`${it.name}-${it.qty}-${it.price}`} direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                {it.qty}× {it.name}
              </Typography>
              <Typography variant="body2">{inr(it.price * it.qty)}</Typography>
            </Stack>
          ))}
        </Stack>
        <Divider sx={{ my: 1.5 }} />
        <Stack spacing={0.5}>
          <TotalRow label="Subtotal" value={inr(subtotal)} />
          {discount > 0 ? <TotalRow label="Discount" value={`− ${inr(discount)}`} /> : null}
          <TotalRow label="Delivery" value={deliveryFee === 0 ? "Free" : inr(deliveryFee)} />
          <TotalRow label="Total" value={inr(total)} strong />
        </Stack>
        <Button
          component="a"
          href={receiptUrl}
          target="_blank"
          rel="noreferrer"
          variant="outlined"
          fullWidth
          sx={{ mt: 2 }}
        >
          ⬇ Download receipt (PDF)
        </Button>
      </CardContent>
    </Card>
  );
}
