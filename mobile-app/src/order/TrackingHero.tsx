import { Linking } from "react-native";
import { XStack, YStack, Text, Button } from "tamagui";
import { useColors, STATUS_FLOW, STATUS_META } from "../theme";
import { MIcon, type IconName } from "../components";
import { kmLabel } from "../geo";

interface Props {
  status: string;
  etaMinutes?: number | null;
  partner?: { name: string; phone?: string | null } | null;
  riderKm?: number | null;
}

const SUBTITLE: Record<string, string> = {
  PLACED: "We've got your order.",
  CONFIRMED: "Your order is confirmed.",
  PREPARING: "Freshly preparing your food.",
  OUT_FOR_DELIVERY: "On the way to your door.",
  DELIVERED: "Hope you enjoyed your meal!",
  CANCELLED: "This order was cancelled.",
};

function HeroStat({ icon, label, value }: Readonly<{ icon: IconName; label: string; value: string }>) {
  const brand = useColors();
  return (
    <XStack gap={8} alignItems="center">
      <MIcon name={icon} size={18} color={brand.gold} />
      <YStack>
        <Text fontSize={11} color={brand.muted}>{label}</Text>
        <Text fontWeight="800" color={brand.text}>{value}</Text>
      </YStack>
    </XStack>
  );
}

/** Domino's-style status hero: headline + progress bar, plus ETA, rider
 *  distance and a call-your-rider row while the order is out for delivery. */
export function TrackingHero({ status, etaMinutes, partner, riderKm }: Readonly<Props>) {
  const brand = useColors();
  const meta = STATUS_META[status] ?? { label: status, color: brand.gold };
  const idx = STATUS_FLOW.indexOf(status);
  const pct = idx < 0 ? 0 : Math.round((idx / (STATUS_FLOW.length - 1)) * 100);
  const outForDelivery = status === "OUT_FOR_DELIVERY";
  const showStats = outForDelivery && (Boolean(etaMinutes) || riderKm != null);

  return (
    <YStack backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} borderRadius={16} padding={18} gap={12}>
      <XStack justifyContent="space-between" alignItems="center" gap={12}>
        <YStack flex={1} gap={2}>
          <Text fontSize={20} fontWeight="800" color={brand.text}>{meta.label}</Text>
          <Text fontSize={13} color={brand.muted}>{SUBTITLE[status] ?? ""}</Text>
        </YStack>
        <YStack width={44} height={44} borderRadius={999} backgroundColor={brand.maroonSoft} alignItems="center" justifyContent="center">
          <MIcon name={outForDelivery ? "moped" : "silverware-fork-knife"} size={22} color={brand.gold} />
        </YStack>
      </XStack>

      {status !== "CANCELLED" && (
        <YStack height={6} borderRadius={999} backgroundColor={brand.cardSoft} overflow="hidden">
          <YStack height={6} width={`${pct}%`} backgroundColor={brand.gold} borderRadius={999} />
        </YStack>
      )}

      {showStats && (
        <XStack gap={20}>
          {etaMinutes ? <HeroStat icon="clock-outline" label="Arriving in" value={`~${etaMinutes} min`} /> : null}
          {riderKm != null ? <HeroStat icon="map-marker-distance" label="Rider away" value={kmLabel(riderKm)} /> : null}
        </XStack>
      )}

      {outForDelivery && partner ? (
        <XStack alignItems="center" gap={12} backgroundColor={brand.cardSoft} borderRadius={12} padding={12}>
          <YStack width={40} height={40} borderRadius={999} backgroundColor={brand.maroonSoft} alignItems="center" justifyContent="center">
            <Text fontWeight="800" color={brand.gold}>{partner.name.charAt(0)}</Text>
          </YStack>
          <YStack flex={1}>
            <Text fontWeight="800" color={brand.text}>{partner.name}</Text>
            <Text fontSize={12} color={brand.muted}>is your delivery hero</Text>
          </YStack>
          {partner.phone ? (
            <Button
              size="$3" circular
              backgroundColor="rgba(228,182,92,0.16)" borderColor={brand.gold} borderWidth={1}
              onPress={() => Linking.openURL(`tel:${partner.phone}`)}
            >
              <MIcon name="phone" size={18} color={brand.gold} />
            </Button>
          ) : null}
        </XStack>
      ) : null}
    </YStack>
  );
}
