import { XStack, YStack, Text } from "tamagui";
import { useColors } from "../theme";
import { FoodThumb } from "../components";
import type { Cat } from "./types";

interface Props {
  cats: Cat[];
  activeCat: string;
  onSelect: (id: string) => void;
}

/** "What are you craving for?" — a tappable category grid (real categories). */
export function CategoryGrid({ cats, activeCat, onSelect }: Readonly<Props>) {
  const brand = useColors();
  const named = cats.filter((c) => c.name?.trim());
  if (named.length === 0) return null;

  return (
    <YStack paddingHorizontal={16} paddingTop={18} gap={12}>
      <Text fontSize={18} fontWeight="800" color={brand.text}>What are you craving for?</Text>
      <XStack flexWrap="wrap" justifyContent="space-between" rowGap={14}>
        {named.map((c) => {
          const active = activeCat === c.id;
          return (
            <YStack
              key={c.id}
              width="31%"
              alignItems="center"
              gap={6}
              pressStyle={{ opacity: 0.8 }}
              onPress={() => onSelect(active ? "ALL" : c.id)}
            >
              <YStack borderRadius={18} borderWidth={2} borderColor={active ? brand.gold : "transparent"} padding={2}>
                <FoodThumb size={84} uri={c.image ?? undefined} />
              </YStack>
              <Text fontSize={12} fontWeight="700" color={active ? brand.gold : brand.dim} numberOfLines={2} textAlign="center">
                {c.name}
              </Text>
            </YStack>
          );
        })}
      </XStack>
    </YStack>
  );
}
