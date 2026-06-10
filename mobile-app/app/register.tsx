import { useState } from "react";
import { Alert } from "react-native";
import { Link, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack, XStack, Text, Button, Input, Spinner } from "tamagui";
import { useAuth } from "../src/auth";
import { brand } from "../src/theme";

export default function Register() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!name || !email || !password) {
      Alert.alert("Missing details", "Name, email and password are required.");
      return;
    }
    setBusy(true);
    try {
      await register(name, email, phone, password);
      router.replace("/");
    } catch (e: unknown) {
      Alert.alert("Couldn't sign up", e instanceof Error ? e.message : "Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <YStack flex={1} backgroundColor={brand.bg} paddingTop={insets.top + 12}>
      <XStack paddingHorizontal={16} paddingBottom={10}>
        <Button size="$3" circular backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} color={brand.text} onPress={() => router.back()}>‹</Button>
      </XStack>

      <YStack flex={1} padding={24} gap={16} justifyContent="center">
        <YStack alignItems="center" gap={4} marginBottom={6}>
          <Text fontSize={26} fontWeight="800" color={brand.text}>Join the family</Text>
          <Text color={brand.muted}>Create an account in seconds.</Text>
        </YStack>

        <Field label="Full name" value={name} onChange={setName} />
        <Field label="Email" value={email} onChange={setEmail} keyboard="email-address" />
        <Field label="Phone (optional)" value={phone} onChange={setPhone} keyboard="phone-pad" />
        <Field label="Password (min 6 chars)" value={password} onChange={setPassword} secure />

        <Button height={52} backgroundColor={brand.gold} color="#2a1a06" fontWeight="800" fontSize={16} disabled={busy} onPress={submit}>
          {busy ? <Spinner color="#2a1a06" /> : "Create account"}
        </Button>

        <XStack justifyContent="center" gap={6}>
          <Text color={brand.muted}>Already have an account?</Text>
          <Link href="/login" asChild>
            <Text color={brand.gold} fontWeight="800">Log in</Text>
          </Link>
        </XStack>
      </YStack>
    </YStack>
  );
}

function Field({
  label, value, onChange, keyboard, secure,
}: { label: string; value: string; onChange: (s: string) => void; keyboard?: "default" | "email-address" | "phone-pad"; secure?: boolean }) {
  return (
    <YStack gap={6}>
      <Text fontSize={12} color={brand.muted} fontWeight="700">{label}</Text>
      <Input value={value} onChangeText={onChange} keyboardType={keyboard ?? "default"} secureTextEntry={secure} autoCapitalize={keyboard === "email-address" ? "none" : "sentences"}
        backgroundColor={brand.bgSoft} borderColor={brand.borderStrong} color={brand.text} />
    </YStack>
  );
}
