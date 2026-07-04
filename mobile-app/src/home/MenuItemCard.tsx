import type { GestureResponderEvent } from "react-native";
import { Link } from "expo-router";
import { YStack, XStack, Text, Button } from "tamagui";
import { useColors, inr } from "../theme";
import { FoodThumb, Badge, Spice, Stars } from "../components";
import type { Item } from "./types";

interface MenuItemCardProps {
  item: Item;
  hue: number;
  onAdd: (item: Item) => void;
}

function TopBadge({ item }: Readonly<{ item: Item }>) {
  const brand = useColors();
  if (!item.isAvailable) {
    return <Badge label="Out of stock" color={brand.red} bg="rgba(224,88,75,0.15)" />;
  }
  if (item.badge === "NONE") return null;
  const isNew = item.badge === "NEW";
  return (
    <Badge
      label={item.badge}
      color={isNew ? brand.green : brand.gold}
      bg={isNew ? "rgba(95,180,95,0.15)" : "rgba(228,182,92,0.15)"}
    />
  );
}

export function MenuItemCard({ item, hue, onAdd }: Readonly<MenuItemCardProps>) {
  const brand = useColors();
  const soldOut = !item.isAvailable;

  return (
    <Link href={`/item/${item.id}`} asChild>
      <YStack
        pressStyle={{ opacity: 0.85 }}
        backgroundColor={brand.card}
        borderColor={brand.border}
        borderWidth={1}
        borderRadius={16}
        padding={12}
        opacity={soldOut ? 0.65 : 1}
      >
        <XStack gap={12}>
          <FoodThumb size={92} hue={hue} uri={item.image} />
          <YStack flex={1} justifyContent="space-between">
            <YStack gap={4}>
              <TopBadge item={item} />
              <Text fontSize={16} fontWeight="800" color={brand.text}>
                {item.name}
              </Text>
              <Text fontSize={12} color={brand.muted} numberOfLines={2}>
                {item.description}
              </Text>
            </YStack>
            <XStack alignItems="center" justifyContent="space-between" marginTop={6}>
              <XStack gap={10} alignItems="center">
                <Text fontSize={15} fontWeight="800" color={brand.gold}>
                  {inr(item.price)}
                </Text>
                <Spice level={item.spiceLevel} />
              </XStack>
              <Stars rating={item.rating} />
            </XStack>
          </YStack>
        </XStack>

        <Button
          size="$3"
          marginTop={10}
          backgroundColor={soldOut ? "rgba(255,255,255,0.05)" : "rgba(228,182,92,0.12)"}
          borderColor={soldOut ? brand.border : brand.gold}
          borderWidth={1}
          color={soldOut ? brand.muted : brand.gold}
          fontWeight="800"
          disabled={soldOut}
          pressStyle={soldOut ? undefined : { backgroundColor: brand.gold }}
          onPress={(e: GestureResponderEvent) => {
            e?.stopPropagation?.();
            if (!soldOut) onAdd(item);
          }}
        >
          {soldOut ? "Out of stock" : "+ Add to cart"}
        </Button>
      </YStack>
    </Link>
  );
}
