import { ScrollView } from "react-native";
import { useQuery } from "@apollo/client";
import { Link, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack, XStack, Text, Button, Spinner } from "tamagui";
import { MY_ORDERS } from "../../src/graphql";
import { useAuth } from "../../src/auth";
import { brand, inr, STATUS_META } from "../../src/theme";

interface Order {
  id: string; orderNumber: string; total: number; status: string; placedAt: string;
  items: { name: string; qty: number }[];
}

export default function Orders() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { data, loading } = useQuery<{ myOrders: Order[] }>(MY_ORDERS, { skip: !user });

  if (!authLoading && !user) {
    return (
      <YStack flex={1} backgroundColor={brand.bg} alignItems="center" justifyContent="center" padding={28} gap={14}>
        <Text fontSize={40}>🧾</Text>
        <Text fontSize={20} fontWeight="800" color={brand.text} textAlign="center">Track your orders</Text>
        <Text color={brand.muted} textAlign="center">Log in to see your order history and live tracking.</Text>
        <Button backgroundColor={brand.gold} color="#2a1a06" fontWeight="800" onPress={() => router.push("/login")}>
          Log in
        </Button>
      </YStack>
    );
  }

  const orders = data?.myOrders ?? [];

  return (
    <YStack flex={1} backgroundColor={brand.bg}>
      <YStack paddingTop={insets.top + 10} paddingHorizontal={18} paddingBottom={8}>
        <Text fontSize={26} fontWeight="800" color={brand.text}>Your orders</Text>
      </YStack>

      {loading && !data ? (
        <YStack flex={1} alignItems="center" justifyContent="center"><Spinner color={brand.gold} /></YStack>
      ) : orders.length === 0 ? (
        <YStack flex={1} alignItems="center" justifyContent="center" padding={28} gap={12}>
          <Text fontSize={40}>🍚</Text>
          <Text color={brand.muted}>No orders yet. Your first biryani awaits!</Text>
          <Button backgroundColor={brand.gold} color="#2a1a06" fontWeight="800" onPress={() => router.push("/")}>
            Browse menu
          </Button>
        </YStack>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 30 }}>
          {orders.map((o) => {
            const meta = STATUS_META[o.status] ?? { label: o.status, color: brand.muted };
            return (
              <Link key={o.id} href={`/order/${o.id}`} asChild>
                <YStack
                  pressStyle={{ opacity: 0.85 }}
                  backgroundColor={brand.card}
                  borderColor={brand.border}
                  borderWidth={1}
                  borderRadius={16}
                  padding={16}
                  gap={8}
                >
                  <XStack justifyContent="space-between" alignItems="center">
                    <Text fontWeight="800" color={brand.text}>{o.orderNumber}</Text>
                    <XStack alignItems="center" gap={6}>
                      <YStack width={8} height={8} borderRadius={999} backgroundColor={meta.color} />
                      <Text fontSize={12} fontWeight="700" color={meta.color}>{meta.label}</Text>
                    </XStack>
                  </XStack>
                  <Text fontSize={13} color={brand.muted} numberOfLines={1}>
                    {o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
                  </Text>
                  <XStack justifyContent="space-between" alignItems="center" marginTop={2}>
                    <Text fontSize={12} color={brand.faint}>{new Date(o.placedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</Text>
                    <Text fontWeight="800" color={brand.gold}>{inr(o.total)}</Text>
                  </XStack>
                </YStack>
              </Link>
            );
          })}
        </ScrollView>
      )}
    </YStack>
  );
}
