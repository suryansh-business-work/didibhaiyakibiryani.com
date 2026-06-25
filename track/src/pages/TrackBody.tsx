import { Alert, Divider, Stack, Typography } from "@mui/material";
import type { TrackOrderResult } from "../graphql";
import TrackTimeline from "./TrackTimeline";
import TrackMap from "./TrackMap";
import OrderSummary from "./OrderSummary";

type Order = NonNullable<TrackOrderResult["trackOrder"]>;

interface Props {
  order: Order;
}

function DeliveryView({ order }: Readonly<Props>) {
  const destination = order.destination ?? null;
  const rider = order.rider ? { lat: order.rider.lat, lng: order.rider.lng } : null;

  if (!destination && !rider) {
    const waiting =
      order.status === "OUT_FOR_DELIVERY"
        ? "Your delivery partner is on the way."
        : "We'll show your delivery partner on the live map once they head out.";
    return (
      <Typography variant="body2" color="text.secondary">
        {waiting}
      </Typography>
    );
  }

  return (
    <Stack spacing={1}>
      <TrackMap destination={destination} rider={rider} />
      {rider ? (
        <Typography variant="caption" sx={{ color: "success.main", fontWeight: 700 }}>
          ● Live — your delivery partner is on the way
        </Typography>
      ) : null}
    </Stack>
  );
}

export default function TrackBody({ order }: Readonly<Props>) {
  if (order.status === "CANCELLED") {
    return (
      <Alert severity="error" variant="outlined">
        This order was cancelled.
      </Alert>
    );
  }
  return (
    <Stack spacing={2.5}>
      <TrackTimeline status={order.status} history={order.statusHistory} />
      <DeliveryView order={order} />
      <Divider />
      <OrderSummary items={order.items} total={order.total} />
    </Stack>
  );
}
