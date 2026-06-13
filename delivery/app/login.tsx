import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack, XStack, Text, Button, Input, Spinner } from "tamagui";
import { useAuth } from "../src/auth";
import { brand } from "../src/theme";

export default function Login() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!emailOrPhone || !password) return;
    setBusy(true);
    try {
      await login(emailOrPhone.trim(), password);
      router.replace("/");
    } catch (e: unknown) {
      Alert.alert("Login failed", e instanceof Error ? e.message : "Check your details and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <YStack flex={1} backgroundColor={brand.bg} paddingTop={insets.top + 24} padding={24} justifyContent="center" gap={18}>
      <YStack alignItems="center" gap={6} marginBottom={6}>
        <YStack width={64} height={64} borderRadius={999} backgroundColor={brand.maroonSoft} borderColor={brand.gold} borderWidth={2} />
        <Text fontSize={14} color={brand.gold} marginTop={6}>Didi Bhaiya · Delivery</Text>
        <Text fontSize={26} fontWeight="800" color={brand.text}>Rider sign in</Text>
        <Text color={brand.muted}>Your assigned orders are waiting.</Text>
      </YStack>

      <YStack gap={6}>
        <Text fontSize={12} color={brand.muted} fontWeight="700">Email or phone</Text>
        <Input value={emailOrPhone} onChangeText={setEmailOrPhone} autoCapitalize="none" keyboardType="email-address"
          backgroundColor={brand.bgSoft} borderColor={brand.borderStrong} color={brand.text} />
      </YStack>
      <YStack gap={6}>
        <Text fontSize={12} color={brand.muted} fontWeight="700">Password</Text>
        <Input value={password} onChangeText={setPassword} secureTextEntry
          backgroundColor={brand.bgSoft} borderColor={brand.borderStrong} color={brand.text} />
      </YStack>

      <Button height={52} backgroundColor={brand.gold} color="#2a1a06" fontWeight="800" fontSize={16} disabled={busy} onPress={submit}>
        {busy ? <Spinner color="#2a1a06" /> : "Sign in"}
      </Button>

      <XStack justifyContent="center">
        <Text fontSize={12} color={brand.faint} textAlign="center">
          No account? Ask the admin to add you under Riders.
        </Text>
      </XStack>
    </YStack>
  );
}
