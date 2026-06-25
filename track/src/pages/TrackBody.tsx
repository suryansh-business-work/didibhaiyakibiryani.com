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
  if (!order.destination) {
    return (
      <Typography variant="body2" color="text.secondary">
        Your order will be ready for pickup.
      </Typography>
    );
  }
  const rider = order.rider ? { lat: order.rider.lat, lng: order.rider.lng } : null;
  return <TrackMap destination={order.destination} rider={rider} />;
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
