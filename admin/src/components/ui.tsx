import type { ReactNode } from "react";
import {
  Box,
  Button,
  Chip,
  type ChipProps,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export function Spinner({ label }: Readonly<{ label?: string }>) {
  return (
    <Box sx={{ display: "grid", placeItems: "center", py: 7, gap: 1.5 }}>
      <CircularProgress color="primary" />
      {label ? <Typography color="text.secondary">{label}</Typography> : null}
    </Box>
  );
}

export function Empty({ children }: Readonly<{ children: ReactNode }>) {
  return <Box sx={{ textAlign: "center", color: "text.secondary", py: 7 }}>{children}</Box>;
}

/**
 * Renders a spinner while loading, an empty-state when there is no data,
 * or its children otherwise — keeps list pages free of nested ternaries.
 */
export function AsyncList({
  loading,
  empty,
  emptyLabel,
  children,
}: Readonly<{
  loading: boolean;
  empty: boolean;
  emptyLabel: string;
  children: ReactNode;
}>) {
  if (loading) {
    return <Spinner />;
  }
  if (empty) {
    return <Empty>{emptyLabel}</Empty>;
  }
  return <>{children}</>;
}

export function Modal({
  title,
  onClose,
  children,
  footer,
}: Readonly<{
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}>) {
  // Dismiss only via the × button or an explicit footer action — ignore
  // backdrop clicks and Escape so a half-filled form isn't lost by accident.
  return (
    <Dialog
      open
      onClose={(_, reason) => {
        if (reason !== "backdropClick") onClose();
      }}
      disableEscapeKeyDown
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1 }}>
        {title}
        <IconButton onClick={onClose} aria-label="Close" size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
      {footer ? <DialogActions sx={{ px: 3, py: 2 }}>{footer}</DialogActions> : null}
    </Dialog>
  );
}

const STATUS_STYLE: Record<string, { color: ChipProps["color"]; label: string }> = {
  PLACED: { color: "warning", label: "Placed" },
  CONFIRMED: { color: "info", label: "Confirmed" },
  PREPARING: { color: "info", label: "Preparing" },
  OUT_FOR_DELIVERY: { color: "primary", label: "Out for delivery" },
  DELIVERED: { color: "success", label: "Delivered" },
  CANCELLED: { color: "error", label: "Cancelled" },
};

export function StatusBadge({ status }: Readonly<{ status: string }>) {
  const s = STATUS_STYLE[status] ?? { color: "default" as const, label: status };
  return <Chip size="small" variant="outlined" color={s.color} label={s.label} />;
}

/** Standard modal footer: a ghost Cancel + a contained primary action. */
export function FormActions({
  onCancel,
  onSave,
  busy,
  saveLabel = "Save",
}: Readonly<{ onCancel: () => void; onSave: () => void; busy?: boolean; saveLabel?: string }>) {
  return (
    <>
      <Button color="inherit" onClick={onCancel}>Cancel</Button>
      <Button variant="contained" onClick={onSave} disabled={busy}>
        {busy ? "Saving…" : saveLabel}
      </Button>
    </>
  );
}

/** Active/off pill used in list tables (green when on, grey otherwise). */
export function OnOffChip({
  on,
  onLabel = "Active",
  offLabel = "Off",
}: Readonly<{ on: boolean; onLabel?: string; offLabel?: string }>) {
  return <Chip size="small" variant="outlined" color={on ? "success" : "default"} label={on ? onLabel : offLabel} />;
}

export function inr(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export function fmtDate(d: string | number): string {
  return new Date(d).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
