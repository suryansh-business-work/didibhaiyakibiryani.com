import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack } from "tamagui";
import { HOME_DATA } from "../../src/graphql";
import { useCart } from "../../src/cart";
import { brand } from "../../src/theme";
import {
  HomeHeader,
  CategoryChips,
  HomeList,
  CartBar,
  type Cat,
  type Item,
} from "../../src/home";

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { add, count, subtotal } = useCart();
  const { data, loading, error } = useQuery<{ categories: Cat[]; menuItems: Item[] }>(HOME_DATA);
  const [activeCat, setActiveCat] = useState<string>("ALL");

  const items = data?.menuItems ?? [];
  const cats = data?.categories ?? [];

  const filtered = useMemo(
    () => (activeCat === "ALL" ? items : items.filter((it) => it.category?.id === activeCat)),
    [items, activeCat]
  );

  const addToCart = (it: Item) =>
    add({ id: it.id, name: it.name, price: it.price, spiceLevel: it.spiceLevel });

  const openCart = () => router.push("/cart");

  return (
    <YStack flex={1} backgroundColor={brand.bg}>
      <HomeHeader count={count} paddingTop={insets.top + 8} onOpenCart={openCart} />
      <CategoryChips cats={cats} activeCat={activeCat} onSelect={setActiveCat} />
      <HomeList
        loading={loading && !data}
        error={error?.message}
        items={filtered}
        count={count}
        onAdd={addToCart}
      />
      {count > 0 && <CartBar count={count} subtotal={subtotal} onPress={openCart} />}
    </YStack>
  );
}
