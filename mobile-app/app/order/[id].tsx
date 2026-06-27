import { ScrollView } from "react-native";
import { useQuery } from "@apollo/client";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack, XStack, Text, Button, Spinner } from "tamagui";
import { ORDER, TRACK_ORDER } from "../../src/graphql";
import { RatingCard, type OrderRating } from "../../src/order/RatingCard";
import { CancelOrder } from "../../src/order/CancelOrder";
import { SupportBox } from "../../src/order/SupportBox";
import { TrackingHero } from "../../src/order/TrackingHero";
import { OrderTimeline } from "../../src/order/OrderTimeline";
import { OrderBill } from "../../src/order/OrderBill";
import { useReorder } from "../../src/order/reorder";
import { FadeInView } from "../../src/animations";
import { BackButton, ErrorState, MIcon } from "../../src/components";
import { useColors } from "../../src/theme";
import { errorMessage } from "../../src/error";
import { haversineKm } from "../../src/geo";

interface OrderItem {
  name: string; price: number; qty: number; spiceLevel?: number;
  menuItem?: { id: string; name: string; price: number; spiceLevel: number; spiceSelectable: boolean; isAvailable: boolean } | null;
}
interface Order {
  id: string; orderNumber: string; status: string; orderType?: string;
  subtotal: number; discount: number; deliveryFee: number; total: number;
  couponCode?: string; paymentMethod: string; placedAt: string;
  items: OrderItem[];
  address?: { line1: string; line2?: string; city: string; pincode: string; phone?: string } | null;
  deliveryPartner?: { id: string; name: string; phone?: string } | null;
  statusHistory: { status: string; at: string }[];
  rating?: OrderRating | null;
}
interface Track {
  etaMinutes?: number | null;
  rider?: { lat: number; lng: number } | null;
  destination?: { lat: number; lng: number } | null;
}

const ACTIVE = ["PLACED", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"];

export default function OrderTracking() {
  const brand = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const reorder = useReorder();
  const { data, loading, error, refetch } = useQuery<{ order: Order }>(ORDER, { variables: { id }, pollInterval: 15000 });
  const o = data?.order;
  const isActive = o ? ACTIVE.includes(o.status) : false;
  const { data: trackData } = useQuery<{ trackOrder: Track }>(TRACK_ORDER, {
    variables: { orderNumber: o?.orderNumber ?? "" },
    skip: !o || !isActive,
    pollInterval: 15000,
  });

  if (loading && !data) {
    return <YStack flex={1} backgroundColor={brand.bg} alignItems="center" justifyContent="center"><Spinner color={brand.gold} /></YStack>;
  }
  if (!o) {
    const isError = Boolean(error);
    return (
      <YStack flex={1} backgroundColor={brand.bg}>
        <XStack paddingTop={insets.top + 8} paddingHorizontal={16} paddingBottom={10}>
          <BackButton onPress={() => router.replace("/orders")} />
        </XStack>
        {isError ? (
          <ErrorState message={errorMessage(error)} onRetry={() => { refetch().catch(() => {}); }} />
        ) : (
          <ErrorState message="We couldn't find this order." onRetry={() => router.replace("/orders")} retryLabel="Back to orders" />
        )}
      </YStack>
    );
  }

  const track = trackData?.trackOrder;
  const riderKm = track?.rider && track?.destination ? haversineKm(track.rider, track.destination) : null;
  const delivered = o.status === "DELIVERED";
  const canCancel = ["PLACED", "CONFIRMED"].includes(o.status);
  const finished = delivered || o.status === "CANCELLED";

  return (
    <YStack flex={1} backgroundColor={brand.bg}>
      <XStack paddingTop={insets.top + 8} paddingHorizontal={16} paddingBottom={10} alignItems="center" gap={12}>
        <BackButton onPress={() => router.replace("/orders")} />
        <YStack>
          <Text fontSize={20} fontWeight="800" color={brand.text}>{o.orderNumber}</Text>
          <Text fontSize={12} color={brand.muted}>{new Date(o.placedAt).toLocaleString("en-IN")}</Text>
        </YStack>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 30 }}>
        <FadeInView>
          <TrackingHero status={o.status} etaMinutes={track?.etaMinutes} partner={o.deliveryPartner} riderKm={riderKm} />
        </FadeInView>

        {delivered && <RatingCard orderId={o.id} rating={o.rating} onRated={() => refetch()} />}

        <OrderTimeline status={o.status} />

        <OrderBill
          items={o.items}
          subtotal={o.subtotal}
          discount={o.discount}
          deliveryFee={o.deliveryFee}
          total={o.total}
          couponCode={o.couponCode}
          paymentMethod={o.paymentMethod}
        />

        <YStack backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} borderRadius={16} padding={16} gap={4}>
          <Text fontWeight="800" color={brand.text}>{o.address ? "Delivering to" : "Fulfilment"}</Text>
          {o.address ? (
            <>
              <Text color={brand.dim}>{o.address.line1}{o.address.line2 ? `, ${o.address.line2}` : ""}</Text>
              <Text color={brand.muted}>{o.address.city} — {o.address.pincode}</Text>
              {o.address.phone ? <Text color={brand.muted}>{o.address.phone}</Text> : null}
            </>
          ) : (
            <Text color={brand.muted}>Takeaway / counter order</Text>
          )}
        </YStack>

        {finished && (
          <Button
            height={48}
            backgroundColor={brand.gold}
            color="#2a1a06"
            fontWeight="800"
            borderRadius={12}
            pressStyle={{ opacity: 0.9 }}
            icon={<MIcon name="refresh" size={18} color="#2a1a06" />}
            onPress={() => reorder(o.items)}
          >
            Reorder
          </Button>
        )}

        <SupportBox orderId={o.id} />

        {canCancel && <CancelOrder orderId={o.id} onCancelled={() => refetch()} />}
      </ScrollView>
    </YStack>
  );
}
