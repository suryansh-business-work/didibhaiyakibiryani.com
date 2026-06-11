import { ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack, XStack, Text, Button, Spinner, Separator } from "tamagui";
import { useAuth } from "../../src/auth";
import { brand } from "../../src/theme";

export default function Profile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <YStack flex={1} backgroundColor={brand.bg} alignItems="center" justifyContent="center"><Spinner color={brand.gold} /></YStack>;
  }

  if (!user) {
    return (
      <YStack flex={1} backgroundColor={brand.bg} alignItems="center" justifyContent="center" padding={28} gap={14}>
        <YStack width={70} height={70} borderRadius={999} backgroundColor={brand.maroonSoft} alignItems="center" justifyContent="center">
          <Text fontSize={30}>👋</Text>
        </YStack>
        <Text fontSize={22} fontWeight="800" color={brand.text}>Welcome to the family</Text>
        <Text color={brand.muted} textAlign="center">Log in to save addresses, reorder in a tap and earn rewards.</Text>
        <Button width="100%" backgroundColor={brand.gold} color="#2a1a06" fontWeight="800" onPress={() => router.push("/login")}>Log in</Button>
        <Button width="100%" chromeless borderColor={brand.borderStrong} borderWidth={1} color={brand.text} onPress={() => router.push("/register")}>Create account</Button>
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor={brand.bg}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, padding: 18, gap: 16 }}>
        <XStack gap={14} alignItems="center">
          <YStack width={62} height={62} borderRadius={999} backgroundColor={brand.maroonSoft} alignItems="center" justifyContent="center">
            <Text fontSize={26} fontWeight="800" color={brand.gold}>{user.name.charAt(0)}</Text>
          </YStack>
          <YStack>
            <Text fontSize={20} fontWeight="800" color={brand.text}>{user.name}</Text>
            <Text fontSize={13} color={brand.muted}>{user.email}</Text>
            {user.phone ? <Text fontSize={13} color={brand.muted}>{user.phone}</Text> : null}
          </YStack>
        </XStack>

        <YStack backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} borderRadius={16} overflow="hidden">
          <Row label="Saved addresses" value={`${user.addresses?.length ?? 0}`} onPress={() => router.push("../addresses")} chevron />
          <Separator borderColor={brand.border} />
          <Row label="My orders" onPress={() => router.push("/orders")} chevron />
          <Separator borderColor={brand.border} />
          <Row label="Offers & coupons" onPress={() => router.push("/offers")} chevron />
        </YStack>

        <YStack backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} borderRadius={16} overflow="hidden">
          <Row label="Delivery hours" value="11 am – 11 pm" />
          <Separator borderColor={brand.border} />
          <Row label="100% Pure Veg · FSSAI" value="✓" valueColor={brand.green} />
        </YStack>

        <Button
          backgroundColor="rgba(224,88,75,0.12)"
          borderColor="rgba(224,88,75,0.4)"
          borderWidth={1}
          color={brand.red}
          fontWeight="800"
          onPress={logout}
        >
          Sign out
        </Button>

        <Text fontSize={11} color={brand.faint} textAlign="center">Didi Bhaiya ki Biryani · Har bite, yaad rahe.</Text>
      </ScrollView>
    </YStack>
  );
}

function Row({
  label, value, valueColor, chevron, onPress,
}: Readonly<{ label: string; value?: string; valueColor?: string; chevron?: boolean; onPress?: () => void }>) {
  return (
    <XStack
      paddingHorizontal={16}
      paddingVertical={15}
      alignItems="center"
      justifyContent="space-between"
      pressStyle={onPress ? { backgroundColor: "rgba(255,255,255,0.03)" } : undefined}
      onPress={onPress}
    >
      <Text color={brand.text} fontWeight="600">{label}</Text>
      <Text color={valueColor ?? brand.muted} fontWeight="700">{value ?? (chevron ? "›" : "")}</Text>
    </XStack>
  );
}
