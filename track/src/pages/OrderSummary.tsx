import { Box, Divider, Stack, Typography } from "@mui/material";

interface Item {
  name: string;
  qty: number;
}

interface Props {
  items: ReadonlyArray<Item>;
  total: number;
}

function formatRupees(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function OrderSummary({ items, total }: Readonly<Props>) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
        Order summary
      </Typography>
      <Stack spacing={0.75}>
        {items.map((item) => (
          <Stack key={item.name} direction="row" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              {item.qty} &times; {item.name}
            </Typography>
          </Stack>
        ))}
      </Stack>
      <Divider sx={{ my: 1.5 }} />
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="body2" sx={{ fontWeight: 800 }}>
          Total
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 800, color: "primary.main" }}>
          {formatRupees(total)}
        </Typography>
      </Stack>
    </Box>
  );
}
