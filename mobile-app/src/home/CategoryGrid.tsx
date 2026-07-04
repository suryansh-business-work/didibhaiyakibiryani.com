import { ScrollView } from "react-native";
import { YStack, Text } from "tamagui";
import { useColors } from "../theme";
import { useSettings } from "../settings";
import { FoodThumb } from "../components";
import type { Cat } from "./types";

interface Props {
  cats: Cat[];
  activeCat: string;
  onSelect: (id: string) => void;
}

/** "What are you craving for?" — an "All" tile plus real categories in a
 *  horizontal scroller. Each shows the admin-uploaded icon (the "All" icon
 *  comes from settings), falling back to the biryani illustration. */
export function CategoryGrid({ cats, activeCat, onSelect }: Readonly<Props>) {
  const brand = useColors();
  const { allCategoryImage } = useSettings();
  const named = cats.filter((c) => c.name?.trim());
  if (named.length === 0) return null;

  const tiles: Cat[] = [{ id: "ALL", name: "All", image: allCategoryImage || undefined }, ...named];

  return (
    <YStack paddingTop={18} gap={12}>
      <Text fontSize={18} fontWeight="800" color={brand.text} paddingHorizontal={16}>What are you craving for?</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 14 }}>
        {tiles.map((c) => {
          const active = activeCat === c.id;
          return (
            <YStack
              key={c.id}
              width={88}
              alignItems="center"
              gap={6}
              pressStyle={{ opacity: 0.8 }}
              onPress={() => onSelect(active && c.id !== "ALL" ? "ALL" : c.id)}
            >
              <YStack borderRadius={18} borderWidth={2} borderColor={active ? brand.gold : "transparent"} padding={2}>
                <FoodThumb size={80} uri={c.image ?? undefined} />
              </YStack>
              <Text fontSize={12} fontWeight="700" color={active ? brand.gold : brand.dim} numberOfLines={2} textAlign="center">
                {c.name}
              </Text>
            </YStack>
          );
        })}
      </ScrollView>
    </YStack>
  );
}
