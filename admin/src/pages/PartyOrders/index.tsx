import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { PARTY_ORDERS } from "../../graphql/queries";
import { UPDATE_PARTY_ORDER_STATUS } from "../../graphql/mutations";
import { Box, Chip, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import Layout from "../../components/Layout";
import { AsyncList, fmtDate } from "../../components/ui";
import { useAlert } from "../../components/dialog";

interface Party {
  id: string;
  name: string;
  phone: string;
  email: string;
  eventDate?: string;
  guests?: number;
  location?: string;
  message?: string;
  status: "NEW" | "CONTACTED" | "CLOSED";
  createdAt: string;
}

const STATUSES = ["NEW", "CONTACTED", "CLOSED"] as const;
const FILTERS = ["ALL", ...STATUSES] as const;

export default function PartyOrders() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("ALL");
  const { data, loading, refetch } = useQuery<{ partyOrders: Party[] }>(PARTY_ORDERS, {
    variables: { status: filter === "ALL" ? null : filter },
  });
  const [updateStatus] = useMutation(UPDATE_PARTY_ORDER_STATUS);
  const notify = useAlert();

  const orders = data?.partyOrders ?? [];

  async function changeStatus(id: string, status: string) {
    try {
      await updateStatus({ variables: { id, status } });
      await refetch();
    } catch (e: unknown) {
      await notify({
        title: "Could not update",
        message: e instanceof Error ? e.message : "Could not update the status.",
      });
    }
  }

  return (
    <Layout title="Party Orders">
      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
        {FILTERS.map((f) => (
          <Chip
            key={f}
            label={f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
            color={filter === f ? "primary" : "default"}
            variant={filter === f ? "filled" : "outlined"}
            onClick={() => setFilter(f)}
          />
        ))}
      </Stack>

      <div className="card">
        <AsyncList loading={loading && !data} empty={orders.length === 0} emptyLabel="No party enquiries yet.">
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>When</TableCell><TableCell>Name</TableCell><TableCell>Contact</TableCell>
                  <TableCell>Event</TableCell><TableCell>Guests</TableCell><TableCell>Details</TableCell><TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id} hover>
                    <TableCell><Typography variant="body2" color="text.secondary">{fmtDate(o.createdAt)}</Typography></TableCell>
                    <TableCell><Typography fontWeight={700}>{o.name}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{o.phone}</Typography>
                      <Typography variant="caption" color="text.secondary">{o.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{o.eventDate || "—"}</Typography>
                      {o.location ? <Typography variant="caption" color="text.secondary">{o.location}</Typography> : null}
                    </TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{o.guests ?? "—"}</Typography></TableCell>
                    <TableCell sx={{ maxWidth: 280, whiteSpace: "pre-wrap" }}>
                      <Typography variant="body2" color="text.secondary">{o.message || "—"}</Typography>
                    </TableCell>
                    <TableCell>
                      <TextField select size="small" value={o.status} onChange={(e) => changeStatus(o.id, e.target.value)} sx={{ minWidth: 130 }}>
                        {STATUSES.map((s) => (
                          <MenuItem key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </AsyncList>
      </div>
    </Layout>
  );
}
