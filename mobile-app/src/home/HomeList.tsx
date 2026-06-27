import type { ReactNode } from "react";
import { ScrollView } from "react-native";
import { YStack, Text, Spinner } from "tamagui";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useColors } from "../theme";
import { RiseIn } from "../animations";
import { ErrorState } from "../components";
import { MenuItemCard } from "./MenuItemCard";
import type { Item } from "./types";

interface HomeListProps {
  loading: boolean;
  error?: string;
  onRetry?: () => void;
  items: Item[];
  count: number;
  onAdd: (item: Item) => void;
  header?: ReactNode;
}

function hueFor(index: number): number {
  return (index * 9 + 12) % 40;
}

export function HomeList({ loading, error, onRetry, items, count, onAdd, header }: Readonly<HomeListProps>) {
  const brand = useColors();
  const tabBarHeight = useBottomTabBarHeight();
  if (loading) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center">
        <Spinner color={brand.gold} />
      </YStack>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 14, paddingBottom: tabBarHeight + (count > 0 ? 84 : 20), gap: 12 }}
    >
      {header && <YStack marginHorizontal={-14}>{header}</YStack>}
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
