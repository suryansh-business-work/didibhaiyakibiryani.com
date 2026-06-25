import { Card, CardContent, Divider, Stack, Typography } from "@mui/material";
import type { SurveyItem } from "./graphql";
import { inr } from "./components";

/** Read-only recap of the order: line items + total. */
export default function OrderSummary({
  items,
  total,
}: Readonly<{ items: SurveyItem[]; total: number }>) {
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
        <Stack direction="row" justifyContent="space-between">
          <Typography fontWeight={800}>Total</Typography>
          <Typography fontWeight={800} color="primary">
            {inr(total)}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
