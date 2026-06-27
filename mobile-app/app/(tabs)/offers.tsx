import { ScrollView, Alert } from "react-native";
import { useQuery } from "@apollo/client";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack, XStack, Text, Button, Spinner } from "tamagui";
import { OFFERS } from "../../src/graphql";
import { useColors, inr } from "../../src/theme";
import { Badge } from "../../src/components";

interface Coupon {
  id: string; code: string; title: string; description?: string; type: string;
  value: number; maxDiscount?: number; minOrder: number; appOnly: boolean; firstOrderOnly: boolean;
}

export default function Offers() {
  const brand = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data, loading, error } = useQuery<{ coupons: Coupon[] }>(OFFERS);
  const coupons = data?.coupons ?? [];

  function use(code: string) {
    Alert.alert("Code ready 🎉", `Apply “${code}” at checkout to grab this deal.`, [
      { text: "Keep browsing" },
      { text: "Order now", onPress: () => router.push("/") },
    ]);
  }

  return (
    <YStack flex={1} backgroundColor={brand.bg}>
      <YStack paddingTop={insets.top + 10} paddingHorizontal={18} paddingBottom={6}>
        <Text fontSize={12} color={brand.gold} fontWeight="800" letterSpacing={2}>TODAY'S DEALS</Text>
        <Text fontSize={26} fontWeight="800" color={brand.text}>More biryani, less on the bill.</Text>
      </YStack>

      {loading && !data ? (
        <YStack flex={1} alignItems="center" justifyContent="center"><Spinner color={brand.gold} /></YStack>
      ) : error ? (
        <Text color={brand.red} padding={24}>{error.message}</Text>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 30 }}>
          {coupons.map((c) => (
            <YStack key={c.id} backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} borderRadius={18} overflow="hidden">
              <YStack padding={18} gap={8}>
                <XStack gap={8}>
                  {c.firstOrderOnly && <Badge label="1st order" color="#6aa3e0" bg="rgba(106,163,224,0.15)" />}
                  {c.appOnly && <Badge label="App only" color={brand.dim} bg="rgba(255,255,255,0.06)" />}
                </XStack>
                <Text fontSize={20} fontWeight="800" color={brand.gold}>
                  {discountText(c)}
                </Text>
                <Text fontSize={15} fontWeight="700" color={brand.text}>{c.title}</Text>
                {c.description && <Text fontSize={13} color={brand.muted}>{c.description}</Text>}
              </YStack>
              <XStack
                paddingHorizontal={18}
                paddingVertical={14}
                borderTopWidth={1}
                borderColor={brand.border}
                borderStyle="dashed"
                alignItems="center"
                justifyContent="space-between"
              >
                <Text fontSize={16} fontWeight="800" color={brand.gold} letterSpacing={2}>{c.code}</Text>
                <Button
                  size="$2.5"
                  backgroundColor="rgba(228,182,92,0.12)"
                  borderColor={brand.gold}
                  borderWidth={1}
                  color={brand.gold}
                  fontWeight="800"
                  pressStyle={{ backgroundColor: brand.gold }}
                  onPress={() => use(c.code)}
                >
                  Use code
                </Button>
              </XStack>
            </YStack>
          ))}
          {coupons.length === 0 && <Text color={brand.muted} textAlign="center" marginTop={40}>No active offers right now.</Text>}
          <Text fontSize={11} color={brand.faint} textAlign="center" marginTop={10}>
            Offers can't be clubbed unless stated. Valid on select cities.
          </Text>
        </ScrollView>
      )}
    </YStack>
  );
}

function discountText(c: Coupon): string {
  if (c.type === "PERCENT") return `${c.value}% OFF${c.maxDiscount ? ` up to ${inr(c.maxDiscount)}` : ""}`;
  if (c.type === "FLAT") return `${inr(c.value)} OFF`;
  if (c.type === "FREE_DELIVERY") return "FREE DELIVERY";
  if (c.type === "FREE_ITEM") return "FREE DESSERT";
  return "OFFER";
}
