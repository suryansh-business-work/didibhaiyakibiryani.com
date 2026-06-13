import { Linking, ScrollView } from "react-native";
import { useQuery } from "@apollo/client";
import { YStack, Text, Button } from "tamagui";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { SETTINGS_LITE } from "../../src/graphql";
import { Loading, RiderHeader } from "../../src/ui";
import { brand } from "../../src/theme";

interface SettingsData {
  settings?: { brandName?: string; supportPhone?: string; supportEmail?: string };
}

const FAQ: ReadonlyArray<{ q: string; a: string }> = [
  { q: "How do I accept an order?", a: "Orders appear in your “My queue” tab. Tap the gold button to confirm pickup and start the delivery." },
  { q: "How are my earnings calculated?", a: "You earn a delivery fee per completed order. See the “Earnings” tab for your history." },
  { q: "Can I cancel an accepted order?", a: "Contact support immediately if you need to cancel. Cancellations may affect your ratings." },
];

export default function Support() {
  const { data, loading } = useQuery<SettingsData>(SETTINGS_LITE);
  const s = data?.settings;

  return (
    <YStack flex={1} backgroundColor={brand.bg}>
      <RiderHeader title="Support" />
      {loading && !data ? (
        <Loading label="Loading…" />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 30 }}>
          <Text color={brand.muted}>
            Contact {s?.brandName || "our"} support for any issues or questions.
          </Text>
          {s?.supportPhone ? (
            <Button height={50} backgroundColor={brand.gold} color="#2a1a06" fontWeight="800"
              icon={<MaterialDesignIcons name="phone" size={18} color="#2a1a06" />}
              onPress={() => Linking.openURL(`tel:${s.supportPhone}`)}>
              Call support
            </Button>
          ) : null}
          {s?.supportEmail ? (
            <Button height={50} backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} color={brand.text}
              icon={<MaterialDesignIcons name="email-outline" size={18} color={brand.text} />}
              onPress={() => Linking.openURL(`mailto:${s.supportEmail}`)}>
              Email support
            </Button>
          ) : null}

          <Text color={brand.gold} fontWeight="800" marginTop={8}>FAQ</Text>
          {FAQ.map((item) => (
            <YStack key={item.q} backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} borderRadius={14} padding={14} gap={4}>
              <Text color={brand.text} fontWeight="700">{item.q}</Text>
              <Text color={brand.muted} fontSize={13}>{item.a}</Text>
            </YStack>
          ))}
        </ScrollView>
      )}
    </YStack>
  );
}
