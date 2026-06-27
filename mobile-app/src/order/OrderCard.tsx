import { XStack, YStack, Text, Button } from "tamagui";
import { useColors, inr, STATUS_META } from "../theme";
import { MIcon, VegMark, type IconName } from "../components";

export interface OrderCardData {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  orderType?: "DELIVERY" | "TAKEAWAY" | null;
  placedAt: string;
  items: Array<{ name: string; qty: number; menuItem?: { isVeg?: boolean } | null }>;
}

const ACTIVE = new Set(["PLACED", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"]);

function fmtWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

/** One order in the "My Orders" list — type + status, veg-marked items, total
 *  and a Track (in-progress) or Reorder (finished) action. */
export function OrderCard({ order, onTrack, onReorder }: Readonly<{ order: OrderCardData; onTrack: () => void; onReorder: () => void }>) {
  const brand = useColors();
  const meta = STATUS_META[order.status] ?? { label: order.status, color: brand.muted };
  const isActive = ACTIVE.has(order.status);
  const takeaway = order.orderType === "TAKEAWAY";
  const typeLabel = takeaway ? "Takeaway" : "Delivery";
  const typeIcon: IconName = takeaway ? "shopping-outline" : "moped";

  return (
    <YStack backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} borderRadius={16} overflow="hidden">
      <XStack padding={16} justifyContent="space-between" alignItems="flex-start" gap={10}>
        <YStack gap={2} flex={1}>
          <XStack gap={6} alignItems="center">
            <MIcon name={typeIcon} size={16} color={brand.gold} />
            <Text fontWeight="800" color={brand.text} fontSize={15}>{typeLabel}</Text>
          </XStack>
          <Text fontSize={13} color={brand.muted}>Order #{order.orderNumber}</Text>
          <Text fontSize={12} color={brand.faint}>{fmtWhen(order.placedAt)}</Text>
        </YStack>
        <XStack paddingHorizontal={10} paddingVertical={5} borderRadius={999} backgroundColor="rgba(255,255,255,0.05)">
          <Text fontSize={11} fontWeight="800" color={meta.color} textTransform="uppercase" letterSpacing={0.4}>{meta.label}</Text>
        </XStack>
      </XStack>

      <YStack height={1} backgroundColor={brand.border} />

      <YStack padding={16} gap={10}>
        {order.items.map((it, i) => (
          <XStack key={`${it.name}-${i}`} alignItems="center" gap={10}>
            {it.menuItem ? <VegMark veg={Boolean(it.menuItem.isVeg)} /> : <YStack width={14} />}
            <Text flex={1} color={brand.dim} numberOfLines={1}>{it.name}</Text>
            <Text color={brand.muted}>{it.qty}</Text>
          </XStack>
        ))}
      </YStack>

      <YStack height={1} backgroundColor={brand.border} />

      <XStack padding={16} justifyContent="space-between" alignItems="center">
        <Text fontWeight="800" color={brand.gold} fontSize={18}>{inr(order.total)}</Text>
        <Button
          height={42}
          paddingHorizontal={30}
          backgroundColor={brand.gold}
          color="#2a1a06"
          fontWeight="800"
          borderRadius={10}
          pressStyle={{ opacity: 0.9 }}
          onPress={isActive ? onTrack : onReorder}
        >
          {isActive ? "Track" : "Reorder"}
        </Button>
      </XStack>
    </YStack>
  );
}
