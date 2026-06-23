import { Box, Dialog, DialogContent, DialogTitle, IconButton, Stack, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { StatusBadge, fmtDate } from "../../components/ui";
import type { Order } from "./types";

interface Props {
  order: Order;
  onClose: () => void;
}

/** Vertical timeline of an order's status changes (from statusHistory). */
export default function OrderTimelineDialog({ order, onClose }: Readonly<Props>) {
  const events = [...order.statusHistory].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        Status timeline — {order.orderNumber}
        <IconButton size="small" onClick={onClose} aria-label="Close"><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {events.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>No status history yet.</Typography>
        ) : (
          <Stack spacing={0}>
            {events.map((e, i) => {
              const last = i === events.length - 1;
              return (
                <Box key={`${e.at}-${e.status}`} sx={{ display: "flex", gap: 1.5 }}>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: last ? "primary.main" : "divider", border: 2, borderColor: "primary.main", mt: 0.5 }} />
                    {!last && <Box sx={{ flex: 1, width: 2, bgcolor: "divider", my: 0.25 }} />}
                  </Box>
                  <Box sx={{ pb: last ? 0 : 2.5, flex: 1, minWidth: 0 }}>
                    <StatusBadge status={e.status} />
                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>{fmtDate(e.at)}</Typography>
                    {e.note ? <Typography variant="body2" color="text.secondary">{e.note}</Typography> : null}
                  </Box>
                </Box>
              );
            })}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
