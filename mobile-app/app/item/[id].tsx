import { useState } from "react";
import { ScrollView } from "react-native";
import { useQuery } from "@apollo/client";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack, XStack, Text, Button, Spinner } from "tamagui";
import { MENU_ITEM } from "../../src/graphql";
import { useCart } from "../../src/cart";
import { brand, inr } from "../../src/theme";
import { FoodThumb, Badge, Stars } from "../../src/components";

interface Item {
  id: string; name: string; description?: string; price: number; spiceLevel: number;
  serves: string; badge: string; isAvailable: boolean; rating: number; ratingCount: number;
  category?: { name: string } | null;
}

const SPICE_LABELS = ["Mild", "Medium", "Spicy", "Fiery"];

export default function ItemDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { add } = useCart();
  const { data, loading } = useQuery<{ menuItem: Item }>(MENU_ITEM, { variables: { id } });

  const [qty, setQty] = useState(1);
  const [spice, setSpice] = useState<number | null>(null);

  if (loading || !data?.menuItem) {
    return <YStack flex={1} backgroundColor={brand.bg} alignItems="center" justifyContent="center"><Spinner color={brand.gold} /></YStack>;
  }
  const it = data.menuItem;
  const chosenSpice = spice ?? it.spiceLevel;

  return (
    <YStack flex={1} backgroundColor={brand.bg}>
      {/* Top bar */}
      <XStack paddingTop={insets.top + 8} paddingHorizontal={16} paddingBottom={8} alignItems="center">
        <Button size="$3" circular backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} color={brand.text} onPress={() => router.back()}>‹</Button>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 30, gap: 16 }}>
        <YStack alignItems="center" paddingVertical={10}>
          <FoodThumb size={200} hue={18} />
        </YStack>

        <YStack gap={8}>
          {!it.isAvailable && (
            <Badge label="Out of stock" color={brand.red} bg="rgba(224,88,75,0.15)" />
          )}
          {it.isAvailable && it.badge !== "NONE" && (
            <Badge label={it.badge} color={it.badge === "NEW" ? brand.green : brand.gold} bg={it.badge === "NEW" ? "rgba(95,180,95,0.15)" : "rgba(228,182,92,0.15)"} />
          )}
          <Text fontSize={26} fontWeight="800" color={brand.text}>{it.name}</Text>
          <XStack gap={12} alignItems="center">
            <Stars rating={it.rating} />
            <Text fontSize={12} color={brand.muted}>{it.ratingCount} ratings · {it.serves}</Text>
          </XStack>
          <Text fontSize={14} color={brand.dim} lineHeight={22}>{it.description}</Text>
        </YStack>

        {/* Spice selector */}
        <YStack gap={10}>
          <Text fontWeight="800" color={brand.text}>Spice level</Text>
          <XStack gap={8} flexWrap="wrap">
            {SPICE_LABELS.map((label, lvl) => (
              <Button
                key={lvl}
                size="$2.5"
                borderRadius={999}
                backgroundColor={chosenSpice === lvl ? "rgba(228,182,92,0.16)" : "rgba(255,255,255,0.04)"}
                borderColor={chosenSpice === lvl ? brand.goldDeep : brand.border}
                borderWidth={1}
                color={chosenSpice === lvl ? brand.gold : brand.dim}
                fontWeight="700"
                onPress={() => setSpice(lvl)}
              >
                {"🌶️".repeat(lvl) || "○"} {label}
              </Button>
            ))}
          </XStack>
        </YStack>

        {/* Quantity */}
        <XStack alignItems="center" justifyContent="space-between" backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} borderRadius={14} padding={14}>
          <Text fontWeight="800" color={brand.text}>Quantity</Text>
          <XStack alignItems="center" gap={16}>
            <Button size="$3" circular backgroundColor={brand.cardSoft} color={brand.gold} fontSize={20} onPress={() => setQty((q) => Math.max(1, q - 1))}>−</Button>
            <Text fontSize={18} fontWeight="800" color={brand.text}>{qty}</Text>
            <Button size="$3" circular backgroundColor={brand.cardSoft} color={brand.gold} fontSize={20} onPress={() => setQty((q) => q + 1)}>+</Button>
          </XStack>
        </XStack>
      </ScrollView>

      {/* Add bar */}
      <XStack paddingHorizontal={16} paddingBottom={insets.bottom + 12} paddingTop={12} backgroundColor="#0c0805" borderTopColor={brand.border} borderTopWidth={1}>
        <Button
          flex={1}
          height={52}
          backgroundColor={it.isAvailable ? brand.gold : brand.cardSoft}
          color={it.isAvailable ? "#2a1a06" : brand.muted}
          fontWeight="800"
          fontSize={16}
          disabled={!it.isAvailable}
          pressStyle={{ opacity: 0.9, scale: 0.98 }}
          onPress={() => {
            add({ id: it.id, name: it.name, price: it.price, spiceLevel: chosenSpice }, qty);
            router.push("/cart");
          }}
        >
          {it.isAvailable ? `Add ${qty} · ${inr(it.price * qty)}` : "Out of stock"}
        </Button>
      </XStack>
    </YStack>
  );
}
