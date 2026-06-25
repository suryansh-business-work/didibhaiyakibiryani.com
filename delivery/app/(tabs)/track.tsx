import { useCallback, useRef } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { YStack } from "tamagui";
import { DELIVERY_QUEUE, UPDATE_RIDER_LOCATION } from "../../src/graphql";
import { Loading, Empty, RiderHeader } from "../../src/ui";
import { brand } from "../../src/theme";
import TrackMap from "../../src/TrackMap";
import type { QueueOrder } from "../../src/types";

const LOCATION_PUSH_MS = 30000;

export default function Track() {
  const { data, loading } = useQuery<{ deliveryQueue: QueueOrder[] }>(DELIVERY_QUEUE, {
    pollInterval: 20000,
  });
  const [pushLocation] = useMutation(UPDATE_RIDER_LOCATION);
  const lastSent = useRef(0);

  // Persist the rider's GPS (throttled) so the customer's tracking page can
  // show a live pin. Only fires while there are deliveries to render.
  const onLocation = useCallback(
    (lat: number, lng: number) => {
      const now = Date.now();
      if (now - lastSent.current < LOCATION_PUSH_MS) return;
      lastSent.current = now;
      pushLocation({ variables: { lat, lng } }).catch(() => undefined);
    },
    [pushLocation],
  );

  const orders = data?.deliveryQueue ?? [];

  let body;
  if (loading && !data) {
    body = <Loading label="Loading the map…" />;
  } else if (orders.length === 0) {
    body = <Empty>No active deliveries to track right now.</Empty>;
  } else {
    body = <TrackMap orders={orders} onLocation={onLocation} />;
  }

  return (
    <YStack flex={1} backgroundColor={brand.bg}>
      <RiderHeader title="Track" />
      {body}
    </YStack>
  );
}
