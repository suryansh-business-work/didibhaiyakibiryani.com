import { ScrollView } from "react-native";
import { XStack, YStack, Text } from "tamagui";
import { useColors, inr } from "../theme";
import { FoodThumb, MIcon } from "../components";
import type { RecentOrder } from "./types";

interface AddArgs { id: string; name: string; price: number; spiceLevel: number; spiceSelectable: boolean }
interface Props {
  orders: RecentOrder[];
  onAdd: (a: AddArgs) => void;
}

interface Dish { id: string; name: string; price: number; image?: string; spiceLevel: number; spiceSelectable: boolean }

/** Most-recent, still-available dishes the customer has ordered (deduped). */
function recentDishes(orders: RecentOrder[]): Dish[] {
  const seen = new Set<string>();
  const out: Dish[] = [];
  for (const o of orders) {
    for (const it of o.items) {
      const m = it.menuItem;
      if (!m || !m.isAvailable || seen.has(m.id)) continue;
      seen.add(m.id);
      out.push({ id: m.id, name: m.name, price: m.price, image: m.image ?? undefined, spiceLevel: m.spiceLevel, spiceSelectable: m.spiceSelectable });
    }
  }
  return out.slice(0, 10);
}

/** "Order again" — previously ordered items with a one-tap add (real orders). */
export function RecentOrderStrip({ orders, onAdd }: Readonly<Props>) {
  const brand = useColors();
  const dishes = recentDishes(orders);
  if (dishes.length === 0) return null;

  return (
    <YStack paddingTop={18} gap={10}>
      <Text fontSize={18} fontWeight="800" color={brand.text} paddingHorizontal={16}>Order again</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
        {dishes.map((d) => (
          <YStack key={d.id} width={148} gap={8}>
            <FoodThumb size={148} uri={d.image} />
            <Text fontSize={13} fontWeight="700" color={brand.text} numberOfLines={1}>{d.name}</Text>
            <XStack alignItems="center" justifyContent="space-between">
              <Text fontSize={13} fontWeight="800" color={brand.text}>{inr(d.price)}</Text>
              <XStack
                alignItems="center"
                gap={4}
                paddingHorizontal={10}
                height={30}
                borderRadius={999}
                backgroundColor="rgba(228,182,92,0.16)"
                borderColor={brand.goldDeep}
                borderWidth={1}
                pressStyle={{ opacity: 0.8, scale: 0.96 }}
                onPress={() => onAdd({ id: d.id, name: d.name, price: d.price, spiceLevel: d.spiceLevel, spiceSelectable: d.spiceSelectable })}
              >
                <MIcon name="plus" size={14} color={brand.gold} />
                <Text fontSize={12} fontWeight="800" color={brand.gold}>Add</Text>
              </XStack>
            </XStack>
          </YStack>
        ))}
      </ScrollView>
    </YStack>
  );
}
