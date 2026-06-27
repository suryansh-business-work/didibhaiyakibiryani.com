import { useQuery } from "@apollo/client";
import { usePathname, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack, XStack, Text } from "tamagui";
import { MY_ORDERS } from "../graphql";
import { useAuth } from "../auth";
import { MIcon } from "../components";
import { useColors, inr, STATUS_META } from "../theme";

interface ActiveOrder {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  placedAt: string;
}

/** Statuses that mean the order is still in progress (worth tracking). */
const ACTIVE = new Set(["PLACED", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"]);

/** Routes where the bar would be redundant or in the way. */
function isHiddenRoute(pathname: string): boolean {
  return (
    pathname.startsWith("/order/") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/checkout"
  );
}

/**
 * Floating "live order" pill shown over every screen once a customer has an
 * order in progress, so they can jump back to live tracking from anywhere.
 */
export function ActiveOrderBar() {
  const brand = useColors();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data } = useQuery<{ myOrders: ActiveOrder[] }>(MY_ORDERS, {
    skip: !user,
    pollInterval: 20000,
    fetchPolicy: "cache-and-network",
  });

  if (!user || isHiddenRoute(pathname)) return null;

  const activeOrders = (data?.myOrders ?? []).filter((o) => ACTIVE.has(o.status));
  // Hermes (RN 0.76) lacks Array.prototype.toSorted — copy then sort.
  const active = [...activeOrders].sort(
    (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
  )[0];
  if (!active) return null;

  const meta = STATUS_META[active.status] ?? { label: active.status, color: brand.gold };

  return (
    <YStack position="absolute" left={12} right={12} bottom={insets.bottom + 70} zIndex={1000}>
      <XStack
        onPress={() => router.push(`/order/${active.id}`)}
        pressStyle={{ opacity: 0.9 }}
        backgroundColor={brand.maroonSoft}
        borderColor={brand.gold}
        borderWidth={1}
        borderRadius={16}
        padding={14}
        alignItems="center"
        gap={12}
        shadowColor="#000"
        shadowOpacity={0.4}
        shadowRadius={16}
        shadowOffset={{ width: 0, height: 8 }}
      >
        <YStack width={10} height={10} borderRadius={999} backgroundColor={meta.color} />
        <YStack flex={1}>
          <Text color={brand.text} fontWeight="800" numberOfLines={1}>
            {active.orderNumber} · {meta.label}
          </Text>
          <Text color={brand.dim} fontSize={12}>Tap to track your order</Text>
        </YStack>
        <XStack alignItems="center" gap={2}>
          <Text color={brand.gold} fontWeight="800">{inr(active.total)}</Text>
          <MIcon name="chevron-right" size={18} color={brand.gold} />
        </XStack>
      </XStack>
    </YStack>
  );
}
