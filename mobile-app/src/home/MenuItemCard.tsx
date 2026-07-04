import type { GestureResponderEvent } from "react-native";
import { Link } from "expo-router";
import { YStack, XStack, Text, Button } from "tamagui";
import { useColors, inr } from "../theme";
import { useCart } from "../cart";
import { FoodThumb, Badge, Spice, Stars, MIcon } from "../components";
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

/** Rounded − qty + stepper shown once the item is in the cart. */
function QtyStepper({ qty, onDec, onInc }: Readonly<{ qty: number; onDec: () => void; onInc: () => void }>) {
  const brand = useColors();
  const stop = (e: GestureResponderEvent, fn: () => void) => {
    e?.stopPropagation?.();
    fn();
  };
  return (
    <XStack marginTop={10} height={40} borderRadius={10} borderWidth={1} borderColor={brand.gold} backgroundColor="rgba(228,182,92,0.14)" alignItems="center" justifyContent="space-between">
      <XStack width={54} height="100%" alignItems="center" justifyContent="center" pressStyle={{ opacity: 0.6 }} onPress={(e: GestureResponderEvent) => stop(e, onDec)}>
        <MIcon name="minus" size={20} color={brand.gold} />
      </XStack>
      <Text fontWeight="800" color={brand.gold} fontSize={16}>{qty}</Text>
      <XStack width={54} height="100%" alignItems="center" justifyContent="center" pressStyle={{ opacity: 0.6 }} onPress={(e: GestureResponderEvent) => stop(e, onInc)}>
        <MIcon name="plus" size={20} color={brand.gold} />
      </XStack>
    </XStack>
  );
}

export function MenuItemCard({ item, hue, onAdd }: Readonly<MenuItemCardProps>) {
  const brand = useColors();
  const { lines, setQty } = useCart();
  const soldOut = !item.isAvailable;
  const qty = lines.find((l) => l.id === item.id)?.qty ?? 0;

  let control = (
    <Button
      size="$3"
      marginTop={10}
      backgroundColor="rgba(228,182,92,0.12)"
      borderColor={brand.gold}
      borderWidth={1}
      color={brand.gold}
      fontWeight="800"
      pressStyle={{ backgroundColor: brand.gold }}
      onPress={(e: GestureResponderEvent) => {
        e?.stopPropagation?.();
        onAdd(item);
      }}
    >
      + Add to cart
    </Button>
  );
  if (soldOut) {
    control = (
      <Button size="$3" marginTop={10} backgroundColor="rgba(255,255,255,0.05)" borderColor={brand.border} borderWidth={1} color={brand.muted} fontWeight="800" disabled>
        Out of stock
      </Button>
    );
  } else if (qty > 0) {
    control = <QtyStepper qty={qty} onDec={() => setQty(item.id, qty - 1)} onInc={() => setQty(item.id, qty + 1)} />;
  }

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

        {control}
      </YStack>
    </Link>
  );
}
