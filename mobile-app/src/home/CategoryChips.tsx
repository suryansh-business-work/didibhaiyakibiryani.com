import { ScrollView } from "react-native";
import { Button } from "tamagui";
import { brand } from "../theme";
import type { Cat } from "./types";

interface CategoryChipsProps {
  cats: Cat[];
  activeCat: string;
  onSelect: (id: string) => void;
}

export function CategoryChips({ cats, activeCat, onSelect }: Readonly<CategoryChipsProps>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 12, gap: 8 }}
    >
      <Chip label="All" active={activeCat === "ALL"} onPress={() => onSelect("ALL")} />
      {cats.map((c) => (
        <Chip
          key={c.id}
          label={c.name}
          active={activeCat === c.id}
          onPress={() => onSelect(c.id)}
        />
      ))}
    </ScrollView>
  );
}

function Chip({
  label,
  active,
  onPress,
}: Readonly<{ label: string; active: boolean; onPress: () => void }>) {
  return (
    <Button
      size="$2"
      borderRadius={999}
      paddingHorizontal={16}
      backgroundColor={active ? "rgba(228,182,92,0.16)" : "rgba(255,255,255,0.04)"}
      borderColor={active ? brand.goldDeep : brand.border}
      borderWidth={1}
      color={active ? brand.gold : brand.dim}
      fontWeight="700"
      onPress={onPress}
    >
      {label}
    </Button>
  );
}
