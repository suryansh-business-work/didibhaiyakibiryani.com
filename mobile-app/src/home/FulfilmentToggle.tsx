import { XStack, YStack, Text } from "tamagui";
import { useColors } from "../theme";
import { MIcon, type IconName } from "../components";
import { useFulfilment, type OrderType } from "../fulfilment";
import { useSettings } from "../settings";

const OPTIONS: ReadonlyArray<{ type: OrderType; label: string; sub: string; icon: IconName }> = [
  { type: "DELIVERY", label: "Delivery", sub: "To your door", icon: "moped" },
  { type: "TAKEAWAY", label: "Takeaway", sub: "Pick up", icon: "shopping-outline" },
];

/** Delivery / Takeaway segmented control. Persists the choice app-wide so the
 *  checkout drops the delivery fee for pickup. */
export function FulfilmentToggle() {
  const brand = useColors();
  const { orderType, setOrderType } = useFulfilment();
  const { storeOpenNow } = useSettings();

  return (
    <XStack paddingHorizontal={16} paddingTop={4} gap={10}>
      {OPTIONS.map((o) => {
        const active = orderType === o.type;
        return (
          <XStack
            key={o.type}
            flex={1}
            alignItems="center"
            gap={10}
            padding={12}
            borderRadius={14}
            backgroundColor={active ? "rgba(228,182,92,0.16)" : brand.card}
            borderColor={active ? brand.goldDeep : brand.border}
            borderWidth={1}
            pressStyle={{ opacity: 0.85 }}
            onPress={() => setOrderType(o.type)}
          >
            <MIcon name={o.icon} size={22} color={active ? brand.gold : brand.dim} />
            <YStack>
              <Text fontSize={14} fontWeight="800" color={active ? brand.gold : brand.text}>{o.label}</Text>
              <Text fontSize={11} color={brand.muted}>
                {o.type === "DELIVERY" && !storeOpenNow ? "Closed now" : o.sub}
              </Text>
            </YStack>
          </XStack>
        );
      })}
    </XStack>
  );
}
