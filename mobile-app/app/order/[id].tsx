import { ScrollView } from "react-native";
import { useQuery } from "@apollo/client";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack, XStack, Text, Button, Spinner } from "tamagui";
import { ORDER } from "../../src/graphql";
import { RatingCard, type OrderRating } from "../../src/order/RatingCard";
import { CancelOrder } from "../../src/order/CancelOrder";
import { FadeInView } from "../../src/animations";
import { brand, inr, STATUS_FLOW, STATUS_META } from "../../src/theme";

interface Order {
  id: string; orderNumber: string; status: string; subtotal: number; discount: number;
  deliveryFee: number; total: number; couponCode?: string; paymentMethod: string; placedAt: string;
  items: { name: string; price: number; qty: number; spiceLevel?: number }[];
  address: { line1: string; line2?: string; city: string; pincode: string; phone?: string };
  statusHistory: { status: string; at: string }[];
  rating?: OrderRating | null;
}

export default function OrderTracking() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data, loading, refetch } = useQuery<{ order: Order }>(ORDER, {
    variables: { id },
    pollInterval: 15000, // live-ish status refresh
  });

  if (loading && !data) {
    return <YStack flex={1} backgroundColor={brand.bg} alignItems="center" justifyContent="center"><Spinner color={brand.gold} /></YStack>;
  }
  if (!data?.order) {
    return <YStack flex={1} backgroundColor={brand.bg} alignItems="center" justifyContent="center"><Text color={brand.muted}>Order not found.</Text></YStack>;
  }

  const o = data.order;
  const cancelled = o.status === "CANCELLED";
  const currentIdx = STATUS_FLOW.indexOf(o.status);
  const canCancel = ["PLACED", "CONFIRMED"].includes(o.status);
  const delivered = o.status === "DELIVERED";

  return (
    <YStack flex={1} backgroundColor={brand.bg}>
      <XStack paddingTop={insets.top + 8} paddingHorizontal={16} paddingBottom={10} alignItems="center" gap={12}>
        <Button size="$3" circular backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} color={brand.text} onPress={() => router.replace("/orders")}>‹</Button>
        <YStack>
          <Text fontSize={20} fontWeight="800" color={brand.text}>{o.orderNumber}</Text>
          <Text fontSize={12} color={brand.muted}>{new Date(o.placedAt).toLocaleString("en-IN")}</Text>
        </YStack>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 30 }}>
        {/* Status timeline */}
        <FadeInView>
        <YStack backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} borderRadius={16} padding={18} gap={2}>
          {cancelled ? (
            <XStack gap={12} alignItems="center" paddingVertical={6}>
              <YStack width={26} height={26} borderRadius={999} backgroundColor={brand.red} alignItems="center" justifyContent="center"><Text color="#fff" fontWeight="800">✕</Text></YStack>
              <Text color={brand.red} fontWeight="800">Order cancelled</Text>
            </XStack>
          ) : (
            STATUS_FLOW.map((st, i) => {
              const done = i <= currentIdx;
              const active = i === currentIdx;
              const meta = STATUS_META[st];
              return (
                <XStack key={st} gap={12} alignItems="center" minHeight={42}>
                  <YStack alignItems="center">
                    <YStack
                      width={22} height={22} borderRadius={999}
                      backgroundColor={done ? brand.gold : brand.cardSoft}
                      borderColor={done ? brand.gold : brand.border} borderWidth={1}
                      alignItems="center" justifyContent="center"
                    >
                      {done && <Text color="#2a1a06" fontSize={12} fontWeight="800">✓</Text>}
                    </YStack>
                    {i < STATUS_FLOW.length - 1 && <YStack width={2} height={20} backgroundColor={i < currentIdx ? brand.gold : brand.border} />}
                  </YStack>
                  <Text color={stepColor(active, done)} fontWeight={active ? "800" : "600"}>
                    {meta.label}
                  </Text>
                </XStack>
              );
            })
          )}
        </YStack>
        </FadeInView>

        {/* Post-delivery rating survey */}
        {delivered && <RatingCard orderId={o.id} rating={o.rating} onRated={() => refetch()} />}

        {/* Items */}
        <YStack backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} borderRadius={16} padding={16} gap={10}>
          <Text fontWeight="800" color={brand.text}>Items</Text>
          {o.items.map((it) => (
            <XStack key={`${it.name}-${it.spiceLevel ?? 0}`} justifyContent="space-between">
              <Text color={brand.dim}>{it.qty}× {it.name}</Text>
              <Text color={brand.dim}>{inr(it.price * it.qty)}</Text>
            </XStack>
          ))}
          <YStack height={1} backgroundColor={brand.border} marginVertical={4} />
          <Row k="Subtotal" v={inr(o.subtotal)} />
          {o.discount > 0 && <Row k={`Discount ${o.couponCode ? `(${o.couponCode})` : ""}`} v={`– ${inr(o.discount)}`} />}
          <Row k="Delivery" v={o.deliveryFee === 0 ? "Free" : inr(o.deliveryFee)} />
          <Row k="Total" v={inr(o.total)} strong />
          <Text fontSize={12} color={brand.muted} marginTop={4}>Payment · {o.paymentMethod === "COD" ? "Cash on delivery" : "Paid online"}</Text>
        </YStack>

        {/* Address */}
        <YStack backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} borderRadius={16} padding={16} gap={4}>
          <Text fontWeight="800" color={brand.text}>Delivering to</Text>
          <Text color={brand.dim}>{o.address.line1}{o.address.line2 ? `, ${o.address.line2}` : ""}</Text>
          <Text color={brand.muted}>{o.address.city} — {o.address.pincode}</Text>
          {o.address.phone ? <Text color={brand.muted}>{o.address.phone}</Text> : null}
        </YStack>

        {canCancel && <CancelOrder orderId={o.id} onCancelled={() => refetch()} />}
      </ScrollView>
    </YStack>
  );
}

function stepColor(active: boolean, done: boolean): string {
  if (active) return brand.gold;
  if (done) return brand.text;
  return brand.muted;
}

function Row({ k, v, strong }: Readonly<{ k: string; v: string; strong?: boolean }>) {
  return (
    <XStack justifyContent="space-between">
      <Text color={strong ? brand.text : brand.dim} fontWeight={strong ? "800" : "400"} fontSize={strong ? 16 : 14}>{k}</Text>
      <Text color={strong ? brand.gold : brand.dim} fontWeight={strong ? "800" : "600"} fontSize={strong ? 16 : 14}>{v}</Text>
    </XStack>
  );
}
