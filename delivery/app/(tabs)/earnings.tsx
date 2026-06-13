import { ScrollView } from "react-native";
import { useQuery } from "@apollo/client";
import { YStack, XStack, Text } from "tamagui";
import { MY_DELIVERIES } from "../../src/graphql";
import { Loading, Empty, RiderHeader } from "../../src/ui";
import { brand, inr, fmtDate } from "../../src/theme";
import type { DeliveredOrder } from "../../src/types";

function isToday(date: string): boolean {
  return new Date(date).toDateString() === new Date().toDateString();
}

function Stat({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <YStack flex={1} backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} borderRadius={14} padding={14} minWidth={100}>
      <Text color={brand.muted} fontSize={11} fontWeight="700">{label}</Text>
      <Text color={brand.gold} fontSize={22} fontWeight="800">{value}</Text>
    </YStack>
  );
}

export default function Earnings() {
  const { data, loading } = useQuery<{ myDeliveries: DeliveredOrder[] }>(MY_DELIVERIES, {
    variables: { limit: 100 },
  });
  const deliveries = data?.myDeliveries ?? [];
  const todayCount = deliveries.filter((d) => isToday(d.placedAt)).length;
  const totalFees = deliveries.reduce((s, d) => s + d.deliveryFee, 0);

  return (
    <YStack flex={1} backgroundColor={brand.bg}>
      <RiderHeader title="Earnings" />
      {loading && !data ? (
        <Loading label="Crunching your numbers…" />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 30 }}>
          <XStack gap={10}>
            <Stat label="Delivered today" value={String(todayCount)} />
            <Stat label="Total delivered" value={String(deliveries.length)} />
            <Stat label="Fees earned" value={inr(totalFees)} />
          </XStack>

          {deliveries.length === 0 ? (
            <Empty>No completed deliveries yet — your history shows up here.</Empty>
          ) : (
            deliveries.map((d) => (
              <XStack key={d.id} backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} borderRadius={14} padding={14} justifyContent="space-between" alignItems="center">
                <YStack>
                  <Text color={brand.text} fontWeight="700">{d.orderNumber}</Text>
                  <Text color={brand.muted} fontSize={12}>{d.address.city} · {d.address.pincode}</Text>
                  <Text color={brand.faint} fontSize={11}>{fmtDate(d.placedAt)}</Text>
                </YStack>
                <YStack alignItems="flex-end">
                  <Text color={brand.gold} fontWeight="800">+{inr(d.deliveryFee)}</Text>
                  <Text color={brand.muted} fontSize={12}>order {inr(d.total)}</Text>
                </YStack>
              </XStack>
            ))
          )}
        </ScrollView>
      )}
    </YStack>
  );
}
