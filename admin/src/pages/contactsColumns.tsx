import { Chip, Link, Tooltip, Typography } from "@mui/material";
import { inr, fmtDate } from "../components/ui";
import type { Column } from "../components/DataTable";

/** A non-signup contact (lead). `orderCount`/`totalSpent` are derived server-side
 *  from POS orders snapshotted against the contact's phone. */
export interface Lead {
  id: string; name: string; phone: string; email?: string; note?: string;
  address?: string; society?: string; block?: string; flat?: string;
  city?: string; state?: string; pincode?: string; lat?: number; lng?: number;
  createdAt: string; orderCount?: number; totalSpent?: number;
}

/** One-line address: a society contact reads "Flat, Block, Society", else the
 *  free-text address. */
export function leadAddress(l: Lead): string {
  if (l.society) return [l.flat ? `Flat ${l.flat}` : "", l.block, l.society].filter(Boolean).join(", ");
  return l.address ?? "";
}

/** Columns for the Manual Customer Contacts table. `viewOrders` jumps to the
 *  Orders page filtered to this contact's orders (by phone). */
export function contactColumns(viewOrders: (l: Lead) => void): Column<Lead>[] {
  return [
    { key: "name", label: "Name", sortable: true, render: (l) => <Typography fontWeight={700}>{l.name}</Typography> },
    { key: "contact", label: "Contact", render: (l) => (
      <>
        <Typography variant="body2" color="text.secondary">{l.phone}</Typography>
        <Typography variant="caption" color="text.secondary">{l.email}</Typography>
      </>
    ) },
    { key: "address", label: "Address", render: (l) => <Typography variant="body2" color="text.secondary">{leadAddress(l) || "—"}</Typography> },
    { key: "note", label: "Note", render: (l) => <Typography variant="body2" color="text.secondary">{l.note}</Typography> },
    { key: "orderCount", label: "Orders", render: (l) => (
      <Tooltip title="View this contact's orders">
        <Chip size="small" variant="outlined" color="primary" label={l.orderCount ?? 0} clickable onClick={() => viewOrders(l)} />
      </Tooltip>
    ) },
    { key: "totalSpent", label: "Lifetime value", align: "right", render: (l) => (
      <Link component="button" type="button" underline="hover" onClick={() => viewOrders(l)} sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
        {inr(l.totalSpent ?? 0)}
      </Link>
    ) },
    { key: "createdAt", label: "Added", sortable: true, render: (l) => <Typography variant="body2" color="text.secondary">{fmtDate(l.createdAt)}</Typography> },
  ];
}
