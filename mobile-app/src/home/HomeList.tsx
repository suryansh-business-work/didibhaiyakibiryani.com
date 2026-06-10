import { ScrollView } from "react-native";
import { YStack, Text, Spinner } from "tamagui";
import { brand } from "../theme";
import { RiseIn } from "../animations";
import { MenuItemCard } from "./MenuItemCard";
import type { Item } from "./types";

interface HomeListProps {
  loading: boolean;
  error?: string;
  items: Item[];
  count: number;
  onAdd: (item: Item) => void;
}

function hueFor(index: number): number {
  return (index * 9 + 12) % 40;
}

export function HomeList({ loading, error, items, count, onAdd }: Readonly<HomeListProps>) {
  if (loading) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center">
        <Spinner color={brand.gold} />
      </YStack>
    );
  }

  if (error) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding={24}>
        <Text color={brand.red} textAlign="center">
          {error}
        </Text>
        <Text color={brand.muted} marginTop={8} textAlign="center" fontSize={13}>
          Is the server running? Check EXPO_PUBLIC_API_URL.
        </Text>
      </YStack>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 14, paddingBottom: count > 0 ? 110 : 30, gap: 12 }}
    >
      {items.map((it, idx) => (
        <RiseIn key={it.id} index={idx}>
          <MenuItemCard item={it} hue={hueFor(idx)} onAdd={onAdd} />
        </RiseIn>
      ))}
      {items.length === 0 && (
        <Text color={brand.muted} textAlign="center" marginTop={40}>
          No items in this category.
        </Text>
      )}
    </ScrollView>
  );
}
