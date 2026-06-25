import { Chip, Stack, Typography } from "@mui/material";
import type { OrderStatus } from "../graphql";
import { statusMeta } from "./statusMeta";

interface Props {
  orderNumber: string;
  status: OrderStatus;
  etaMinutes: number | null;
}

export default function TrackHeader({ orderNumber, status, etaMinutes }: Readonly<Props>) {
  const meta = statusMeta(status);
  return (
    <Stack spacing={1}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
        <Typography variant="h6" sx={{ wordBreak: "break-all" }}>
          #{orderNumber}
        </Typography>
        <Chip label={meta.label} color={meta.chipColor} size="small" />
      </Stack>
      {etaMinutes != null ? (
        <Typography variant="body2" color="text.secondary">
          ETA ~{etaMinutes} min
        </Typography>
      ) : null}
    </Stack>
  );
}
