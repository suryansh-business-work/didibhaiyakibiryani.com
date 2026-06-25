import { useQuery } from "@apollo/client";
import { YStack } from "tamagui";
import { DELIVERY_QUEUE } from "../../src/graphql";
import { Loading, Empty, RiderHeader } from "../../src/ui";
import { brand } from "../../src/theme";
import TrackMap from "../../src/TrackMap";
import type { QueueOrder } from "../../src/types";

export default function Track() {
  const { data, loading } = useQuery<{ deliveryQueue: QueueOrder[] }>(DELIVERY_QUEUE, {
    pollInterval: 20000,
  });
  const orders = data?.deliveryQueue ?? [];

  let body;
  if (loading && !data) {
    body = <Loading label="Loading the map…" />;
  } else if (orders.length === 0) {
    body = <Empty>No active deliveries to track right now.</Empty>;
  } else {
    body = <TrackMap orders={orders} />;
  }

  return (
    <YStack flex={1} backgroundColor={brand.bg}>
      <RiderHeader title="Track" />
      {body}
    </YStack>
  );
}
