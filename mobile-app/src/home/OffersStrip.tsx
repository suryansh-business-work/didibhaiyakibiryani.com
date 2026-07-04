import { ScrollView } from "react-native";
import { XStack, YStack, Text } from "tamagui";
import { useColors } from "../theme";
import { MIcon } from "../components";
import type { Coupon } from "./types";

interface Props {
  coupons: Coupon[];
  onPress: () => void;
}

/** Fallback label when a coupon has no title. */
function offerLabel(c: Coupon): string {
  if (c.type === "FREE_DELIVERY") return "Free delivery";
  if (c.type === "FREE_ITEM") return "Free item on us";
  if (c.type === "PERCENT") return `${c.value}% off`;
  return `₹${c.value} off`;
}

/** "Offers for you" — horizontal coupon cards (real, active coupons). */
export function OffersStrip({ coupons, onPress }: Readonly<Props>) {
  const brand = useColors();
  const list = coupons.filter((c) => c.code);
  if (list.length === 0) return null;

  return (
    <YStack paddingTop={18} gap={10}>
      <Text fontSize={18} fontWeight="800" color={brand.text} paddingHorizontal={16}>Offers for you</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
        {list.map((c) => (
          <YStack
            key={c.id}
            width={230}
            padding={14}
            borderRadius={14}
            backgroundColor={brand.card}
            borderColor={brand.border}
            borderWidth={1}
            gap={6}
            pressStyle={{ opacity: 0.85 }}
            onPress={onPress}
          >
            <XStack alignItems="center" gap={6}>
              <MIcon name="ticket-percent-outline" size={18} color={brand.gold} />
              <Text fontSize={14} fontWeight="800" color={brand.gold}>{c.code}</Text>
            </XStack>
            <Text fontSize={13} fontWeight="700" color={brand.text} numberOfLines={1}>{c.title || offerLabel(c)}</Text>
            {c.description ? <Text fontSize={11} color={brand.muted} numberOfLines={2}>{c.description}</Text> : null}
          </YStack>
        ))}
      </ScrollView>
    </YStack>
  );
}
