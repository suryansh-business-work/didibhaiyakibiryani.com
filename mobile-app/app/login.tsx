import { useState } from "react";
import { Alert } from "react-native";
import { Link, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack, XStack, Text, Button, Input, Spinner } from "tamagui";
import { useAuth } from "../src/auth";
import { brand } from "../src/theme";

export default function Login() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();
  const [emailOrPhone, setEmailOrPhone] = useState("ananya@example.com");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!emailOrPhone || !password) return;
    setBusy(true);
    try {
      await login(emailOrPhone, password);
      router.replace("/");
    } catch (e: unknown) {
      Alert.alert("Login failed", e instanceof Error ? e.message : "Check your details and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <YStack flex={1} backgroundColor={brand.bg} paddingTop={insets.top + 12}>
      <XStack paddingHorizontal={16} paddingBottom={10}>
        <Button size="$3" circular backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} color={brand.text} onPress={() => router.back()}>‹</Button>
      </XStack>

      <YStack flex={1} padding={24} gap={18} justifyContent="center">
        <YStack alignItems="center" gap={6} marginBottom={6}>
          <YStack width={64} height={64} borderRadius={999} backgroundColor={brand.maroonSoft} borderColor={brand.gold} borderWidth={2} />
          <Text fontSize={14} color={brand.gold} marginTop={6}>Har bite, yaad rahe!</Text>
          <Text fontSize={26} fontWeight="800" color={brand.text}>Welcome back</Text>
          <Text color={brand.muted}>Log in to order your favourite biryani.</Text>
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
          {busy ? <Spinner color="#2a1a06" /> : "Log in"}
        </Button>

        <XStack justifyContent="center" gap={6}>
          <Text color={brand.muted}>New here?</Text>
          <Link href="/register" asChild>
            <Text color={brand.gold} fontWeight="800">Create an account</Text>
          </Link>
        </XStack>

        <Text fontSize={12} color={brand.faint} textAlign="center">Demo: ananya@example.com / Test@123</Text>
      </YStack>
    </YStack>
  );
}
