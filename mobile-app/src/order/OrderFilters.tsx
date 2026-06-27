import { ScrollView } from "react-native";
import { XStack, Text } from "tamagui";
import { useColors } from "../theme";

export type OrderFilter = "ALL" | "DELIVERY" | "TAKEAWAY";

const FILTERS: ReadonlyArray<{ key: OrderFilter; label: string }> = [
  { key: "ALL", label: "All" },
  { key: "DELIVERY", label: "Delivery" },
  { key: "TAKEAWAY", label: "Takeaway" },
];

/** Domino's-style order-type filter chips (real fulfilment types only). */
export function OrderFilters({ value, onChange }: Readonly<{ value: OrderFilter; onChange: (f: OrderFilter) => void }>) {
  const brand = useColors();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
      {FILTERS.map((f) => {
        const active = value === f.key;
        return (
          <XStack
            key={f.key}
            height={36}
            paddingHorizontal={18}
            borderRadius={999}
            alignItems="center"
            backgroundColor={active ? "rgba(228,182,92,0.16)" : brand.card}
            borderColor={active ? brand.gold : brand.border}
            borderWidth={1}
            pressStyle={{ opacity: 0.85 }}
            onPress={() => onChange(f.key)}
          >
            <Text fontWeight="800" color={active ? brand.gold : brand.dim}>{f.label}</Text>
          </XStack>
        );
      })}
    </ScrollView>
  );
}
