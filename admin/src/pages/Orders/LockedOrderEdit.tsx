import { useState } from "react";
import { useMutation } from "@apollo/client";
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { UPDATE_ORDER_STATUS } from "../../graphql/mutations";
import { inr } from "../../components/ui";
import { STATUS_SEQUENCE, type Order } from "./types";

interface Props {
  order: Order;
  onClose: () => void;
  onSaved: () => void;
}

/** A delivered order is locked from editing — only its status can be corrected
 * (e.g. reverting an accidental delivery). */
export default function LockedOrderEdit({ order, onClose, onSaved }: Readonly<Props>) {
  const [status, setStatus] = useState(order.status);
  const [updateStatus, { loading, error }] = useMutation(UPDATE_ORDER_STATUS);
  const changed = status !== order.status;

  async function save() {
    await updateStatus({ variables: { id: order.id, status } });
    onSaved();
    onClose();
  }

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        Order {order.orderNumber}
        <IconButton size="small" onClick={onClose} aria-label="Close"><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {order.status === "DELIVERED"
            ? "This order is delivered, so its items can't be edited — you can still correct the status below."
            : "Update the order's delivery status below."}
        </Typography>
        <Stack spacing={0.5} sx={{ my: 1.5 }}>
          {order.items.map((it) => (
            <Stack key={`${it.name}-${it.qty}-${it.price}`} direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">{it.qty}× {it.name}</Typography>
              <Typography variant="body2">{inr(it.price * it.qty)}</Typography>
            </Stack>
          ))}
        </Stack>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography fontWeight={800}>Total</Typography>
          <Typography fontWeight={800} color="primary">{inr(order.total)}</Typography>
        </Box>
        <Autocomplete
          options={STATUS_SEQUENCE}
          getOptionLabel={(o) => o.label}
          isOptionEqualToValue={(o, v) => o.value === v.value}
          value={STATUS_SEQUENCE.find((s) => s.value === status) ?? STATUS_SEQUENCE[0]}
          onChange={(_, opt) => setStatus(opt.value)}
          disableClearable
          fullWidth
          size="small"
          renderInput={(params) => <TextField {...params} label="Order status" />}
        />
        {error ? <Typography color="error" variant="body2" sx={{ mt: 1 }}>{error.message}</Typography> : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button color="inherit" onClick={onClose}>Close</Button>
        {changed ? (
          <Button variant="contained" onClick={save} disabled={loading}>{loading ? "Saving…" : "Save changes"}</Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}
