import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack } from "tamagui";
import { HOME_DATA, OFFERS, MY_ORDERS } from "../../src/graphql";
import { useCart } from "../../src/cart";
import { useAuth } from "../../src/auth";
import { useColors } from "../../src/theme";
import { errorMessage } from "../../src/error";
import {
  HomeHeader,
  FulfilmentToggle,
  HomeSlider,
  CategoryGrid,
  OffersStrip,
  RecentOrderStrip,
  RewardsStrip,
  HomeList,
  CartBar,
  StoreClosedBanner,
  type Cat,
  type Item,
  type Banner,
  type Coupon,
  type RecentOrder,
} from "../../src/home";

interface AddArgs { id: string; name: string; price: number; spiceLevel: number; spiceSelectable: boolean }

export default function Home() {
  const brand = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { add, count, subtotal } = useCart();
  const { data, loading, error, refetch } = useQuery<{ banners: Banner[]; categories: Cat[]; menuItems: Item[] }>(HOME_DATA);
  const { data: offerData } = useQuery<{ coupons: Coupon[] }>(OFFERS);
  const { data: orderData } = useQuery<{ myOrders: RecentOrder[] }>(MY_ORDERS, { skip: !user });
  const [activeCat, setActiveCat] = useState<string>("ALL");

  const items = data?.menuItems ?? [];
  const cats = data?.categories ?? [];
  const banners = data?.banners ?? [];
  const coupons = offerData?.coupons ?? [];
  const orders = orderData?.myOrders ?? [];

  const filtered = useMemo(
    () => (activeCat === "ALL" ? items : items.filter((it) => it.category?.id === activeCat)),
    [items, activeCat]
  );

  const addToCart = (it: AddArgs) =>
    add({ id: it.id, name: it.name, price: it.price, spiceLevel: it.spiceLevel, spiceSelectable: it.spiceSelectable });

  const def = user?.addresses?.find((a) => a.isDefault) ?? user?.addresses?.[0];
  const location = def?.city || def?.line1 || "Set your location";
  const initial = user?.name?.trim()?.charAt(0)?.toUpperCase() ?? "";

  return (
    <YStack flex={1} backgroundColor={brand.bg}>
      <HomeHeader
        location={location}
        initial={initial}
        avatarUri={user?.avatarUrl}
        paddingTop={insets.top + 8}
        onLocation={() => router.push("/addresses")}
        onRedeem={() => router.push("/rewards")}
        onAccount={() => router.push(user ? "/profile" : "/login")}
      />
      <StoreClosedBanner />
      <HomeList
        loading={loading && !data}
        error={error && !data ? errorMessage(error) : undefined}
        onRetry={() => { refetch().catch(() => {}); }}
        items={filtered}
        count={count}
        onAdd={addToCart}
        header={
          <>
            <FulfilmentToggle />
            <HomeSlider banners={banners} />
            <OffersStrip coupons={coupons} onPress={() => router.push("/offers")} />
            <RewardsStrip />
            <RecentOrderStrip orders={orders} onAdd={addToCart} />
            <CategoryGrid cats={cats} activeCat={activeCat} onSelect={setActiveCat} />
          </>
        }
      />
      {count > 0 && <CartBar count={count} subtotal={subtotal} onPress={() => router.push("/cart")} />}
    </YStack>
  );
}
