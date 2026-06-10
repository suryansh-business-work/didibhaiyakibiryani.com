import { ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack, XStack, Text, Button } from "tamagui";
import { useCart } from "../src/cart";
import { brand, inr } from "../src/theme";

const DELIVERY_FEE = 39;
const FREE_OVER = 399;

export default function Cart() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { lines, subtotal, setQty, remove } = useCart();

  const deliveryFee = subtotal >= FREE_OVER || subtotal === 0 ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryFee;

  return (
    <YStack flex={1} backgroundColor={brand.bg}>
      <XStack paddingTop={insets.top + 8} paddingHorizontal={16} paddingBottom={10} alignItems="center" gap={12}>
        <Button size="$3" circular backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} color={brand.text} onPress={() => router.back()}>‹</Button>
        <Text fontSize={22} fontWeight="800" color={brand.text}>Your cart</Text>
      </XStack>

      {lines.length === 0 ? (
        <YStack flex={1} alignItems="center" justifyContent="center" gap={12} padding={28}>
          <Text fontSize={42}>🛒</Text>
          <Text color={brand.muted}>Your cart is empty.</Text>
          <Button backgroundColor={brand.gold} color="#2a1a06" fontWeight="800" onPress={() => router.replace("/")}>Browse menu</Button>
        </YStack>
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 20 }}>
            {lines.map((l) => (
              <XStack key={l.id} backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} borderRadius={14} padding={14} gap={12} alignItems="center">
                <YStack flex={1} gap={4}>
                  <Text fontWeight="800" color={brand.text}>{l.name}</Text>
                  <Text fontSize={12} color={brand.muted}>
                    {inr(l.price)} {l.spiceLevel > 0 ? `· ${"🌶️".repeat(l.spiceLevel)}` : ""}
                  </Text>
                  <Text fontSize={11} color={brand.faint} onPress={() => remove(l.id)}>Remove</Text>
                </YStack>
                <XStack alignItems="center" gap={12} backgroundColor={brand.cardSoft} borderRadius={999} paddingHorizontal={6} paddingVertical={4}>
                  <Button size="$2" circular chromeless color={brand.gold} fontSize={18} onPress={() => setQty(l.id, l.qty - 1)}>−</Button>
                  <Text fontWeight="800" color={brand.text}>{l.qty}</Text>
                  <Button size="$2" circular chromeless color={brand.gold} fontSize={18} onPress={() => setQty(l.id, l.qty + 1)}>+</Button>
                </XStack>
                <Text fontWeight="800" color={brand.gold} minWidth={60} textAlign="right">{inr(l.price * l.qty)}</Text>
              </XStack>
            ))}

            <YStack backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} borderRadius={14} padding={16} gap={8} marginTop={4}>
              <Row k="Subtotal" v={inr(subtotal)} />
              <Row k="Delivery" v={deliveryFee === 0 ? "Free" : inr(deliveryFee)} />
              {subtotal < FREE_OVER && (
                <Text fontSize={12} color={brand.gold}>Add {inr(FREE_OVER - subtotal)} more for free delivery 🚚</Text>
              )}
              <YStack height={1} backgroundColor={brand.border} marginVertical={4} />
              <Row k="Total" v={inr(total)} strong />
            </YStack>
          </ScrollView>

          <XStack paddingHorizontal={16} paddingBottom={insets.bottom + 12} paddingTop={12} backgroundColor="#0c0805" borderTopColor={brand.border} borderTopWidth={1}>
            <Button flex={1} height={52} backgroundColor={brand.gold} color="#2a1a06" fontWeight="800" fontSize={16} onPress={() => router.push("/checkout")}>
              Proceed to checkout · {inr(total)}
            </Button>
          </XStack>
        </>
      )}
    </YStack>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <XStack justifyContent="space-between">
      <Text color={strong ? brand.text : brand.dim} fontWeight={strong ? "800" : "400"} fontSize={strong ? 17 : 14}>{k}</Text>
      <Text color={strong ? brand.gold : brand.dim} fontWeight={strong ? "800" : "600"} fontSize={strong ? 17 : 14}>{v}</Text>
    </XStack>
  );
}
