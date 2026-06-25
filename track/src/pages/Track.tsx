import { useParams } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { Alert, Box, Card, CardContent, CircularProgress, Divider, Stack } from "@mui/material";
import { TRACK_ORDER } from "../graphql";
import type { TrackOrderResult } from "../graphql";
import TrackHeader from "./TrackHeader";
import TrackBody from "./TrackBody";

const SHELL_SX = { minHeight: "100vh", display: "grid", placeItems: "center", p: 2 } as const;

export default function Track() {
  const { orderNumber = "" } = useParams<{ orderNumber: string }>();
  const { data, loading, error } = useQuery<TrackOrderResult>(TRACK_ORDER, {
    variables: { orderNumber },
    pollInterval: 15000,
    fetchPolicy: "cache-and-network",
  });

  const order = data?.trackOrder ?? null;

  if (loading && !order) {
    return (
      <Box sx={SHELL_SX}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error || !order) {
    return (
      <Box sx={SHELL_SX}>
        <Alert severity="error" sx={{ maxWidth: 420 }}>
          This tracking link is invalid.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={SHELL_SX}>
      <Card sx={{ width: "100%", maxWidth: 480 }}>
        <CardContent>
          <Stack spacing={2.5}>
            <TrackHeader
              orderNumber={order.orderNumber}
              status={order.status}
              etaMinutes={order.etaMinutes}
            />
            <Divider />
            <TrackBody order={order} />
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
