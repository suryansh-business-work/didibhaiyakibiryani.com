import { ScrollView } from "react-native";
import { XStack, Text } from "tamagui";
import { useColors } from "../theme";
import type { Cat } from "./types";

interface CategoryChipsProps {
  cats: Cat[];
  activeCat: string;
  onSelect: (id: string) => void;
}

export function CategoryChips({ cats, activeCat, onSelect }: Readonly<CategoryChipsProps>) {
  const named = cats.filter((c) => c.name?.trim());
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0, flexShrink: 0 }}
      contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 12, gap: 8, alignItems: "center" }}
    >
      <Chip label="All" active={activeCat === "ALL"} onPress={() => onSelect("ALL")} />
      {named.map((c) => (
        <Chip key={c.id} label={c.name} active={activeCat === c.id} onPress={() => onSelect(c.id)} />
      ))}
    </ScrollView>
  );
}

function Chip({
  label,
  active,
  onPress,
}: Readonly<{ label: string; active: boolean; onPress: () => void }>) {
  const brand = useColors();
  return (
    <XStack
      height={34}
      borderRadius={999}
      paddingHorizontal={16}
      alignItems="center"
      justifyContent="center"
      backgroundColor={active ? "rgba(228,182,92,0.16)" : "rgba(255,255,255,0.04)"}
      borderColor={active ? brand.goldDeep : brand.border}
      borderWidth={1}
      pressStyle={{ opacity: 0.8 }}
      onPress={onPress}
    >
      <Text fontSize={13} fontWeight="700" color={active ? brand.gold : brand.dim}>
        {label}
      </Text>
    </XStack>
  );
}
