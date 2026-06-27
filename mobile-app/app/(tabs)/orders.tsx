import { useMemo, useState } from "react";
import { ScrollView } from "react-native";
import { useQuery } from "@apollo/client";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack, Text, Button, Spinner } from "tamagui";
import { MY_ORDERS } from "../../src/graphql";
import { useAuth } from "../../src/auth";
import { useColors } from "../../src/theme";
import { errorMessage } from "../../src/error";
import { ErrorState } from "../../src/components";
import { OrderCard } from "../../src/order/OrderCard";
import { OrderFilters, type OrderFilter } from "../../src/order/OrderFilters";
import { useReorder } from "../../src/order/reorder";

interface OrderItem {
  name: string;
  qty: number;
  menuItem?: { id: string; name: string; price: number; spiceLevel: number; spiceSelectable: boolean; isAvailable: boolean; isVeg?: boolean } | null;
}
interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  orderType?: "DELIVERY" | "TAKEAWAY" | null;
  placedAt: string;
  items: OrderItem[];
}

export default function Orders() {
  const brand = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { data, loading, error, refetch } = useQuery<{ myOrders: Order[] }>(MY_ORDERS, { skip: !user });
  const [filter, setFilter] = useState<OrderFilter>("ALL");
  const reorder = useReorder();

  const orders = data?.myOrders ?? [];
  const shown = useMemo(
    () => (filter === "ALL" ? orders : orders.filter((o) => (o.orderType ?? "DELIVERY") === filter)),
    [orders, filter]
  );

  if (!authLoading && !user) {
    return (
      <YStack flex={1} backgroundColor={brand.bg} alignItems="center" justifyContent="center" padding={28} gap={14}>
        <Text fontSize={40}>🧾</Text>
        <Text fontSize={20} fontWeight="800" color={brand.text} textAlign="center">Track your orders</Text>
        <Text color={brand.muted} textAlign="center">Log in to see your order history and live tracking.</Text>
        <Button backgroundColor={brand.gold} color="#2a1a06" fontWeight="800" onPress={() => router.push("/login")}>Log in</Button>
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor={brand.bg}>
      <YStack paddingTop={insets.top + 10} paddingBottom={10} gap={12}>
        <Text fontSize={26} fontWeight="800" color={brand.text} paddingHorizontal={18}>My Orders</Text>
        <OrderFilters value={filter} onChange={setFilter} />
      </YStack>

      {loading && !data ? (
        <YStack flex={1} alignItems="center" justifyContent="center"><Spinner color={brand.gold} /></YStack>
      ) : error && !data ? (
        <ErrorState message={errorMessage(error)} onRetry={() => { refetch().catch(() => {}); }} />
      ) : orders.length === 0 ? (
        <YStack flex={1} alignItems="center" justifyContent="center" padding={28} gap={12}>
          <Text fontSize={40}>🍚</Text>
          <Text color={brand.muted}>No orders yet. Your first biryani awaits!</Text>
          <Button backgroundColor={brand.gold} color="#2a1a06" fontWeight="800" onPress={() => router.push("/")}>Browse menu</Button>
        </YStack>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 30 }}>
          {shown.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              onTrack={() => router.push(`/order/${o.id}`)}
              onReorder={() => reorder(o.items)}
            />
          ))}
          {shown.length === 0 && (
            <Text color={brand.muted} textAlign="center" paddingVertical={30}>No {filter.toLowerCase()} orders yet.</Text>
          )}
        </ScrollView>
      )}
    </YStack>
  );
}
