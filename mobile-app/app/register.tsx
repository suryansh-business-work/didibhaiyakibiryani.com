import { useState } from "react";
import { Alert } from "react-native";
import { Link, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack, XStack, Text, Button, Input, Spinner } from "tamagui";
import { useAuth } from "../src/auth";
import { brand } from "../src/theme";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { requestSignupOtp, register } = useAuth();
  const [step, setStep] = useState<"details" | "verify">("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendOtp() {
    if (!name.trim() || !EMAIL_RE.test(email.trim())) {
      Alert.alert("Check your details", "Enter your name and a valid email.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      await requestSignupOtp(name.trim(), email.trim());
      setStep("verify");
    } catch (e: unknown) {
      Alert.alert("Couldn't send code", e instanceof Error ? e.message : "Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    if (otp.trim().length < 6) {
      Alert.alert("Enter the code", "Type the 6-digit code we emailed you.");
      return;
    }
    setBusy(true);
    try {
      await register(name.trim(), email.trim(), password, otp.trim());
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
        <Button size="$3" circular backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} color={brand.text} onPress={() => (step === "verify" ? setStep("details") : router.back())}>‹</Button>
      </XStack>

      <YStack flex={1} padding={24} gap={16} justifyContent="center">
        <YStack alignItems="center" gap={4} marginBottom={6}>
          <Text fontSize={26} fontWeight="800" color={brand.text}>Join the family</Text>
          <Text color={brand.muted}>
            {step === "details" ? "Create an account with your email." : `Enter the code sent to ${email.trim()}.`}
          </Text>
        </YStack>

        {step === "details" ? (
          <>
            <Field label="Full name" value={name} onChange={setName} />
            <Field label="Email" value={email} onChange={setEmail} keyboard="email-address" />
            <Field label="Password (min 6 chars)" value={password} onChange={setPassword} secure />
            <Button height={52} backgroundColor={brand.gold} color="#2a1a06" fontWeight="800" fontSize={16} disabled={busy} onPress={sendOtp}>
              {busy ? <Spinner color="#2a1a06" /> : "Send verification code"}
            </Button>
          </>
        ) : (
          <>
            <Field label="6-digit code" value={otp} onChange={setOtp} keyboard="number-pad" />
            <Button height={52} backgroundColor={brand.gold} color="#2a1a06" fontWeight="800" fontSize={16} disabled={busy} onPress={verify}>
              {busy ? <Spinner color="#2a1a06" /> : "Verify & create account"}
            </Button>
            <Button chromeless color={brand.gold} disabled={busy} onPress={sendOtp}>Resend code</Button>
          </>
        )}

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
}: Readonly<{ label: string; value: string; onChange: (s: string) => void; keyboard?: "default" | "email-address" | "number-pad"; secure?: boolean }>) {
  return (
    <YStack gap={6}>
      <Text fontSize={12} color={brand.muted} fontWeight="700">{label}</Text>
      <Input value={value} onChangeText={onChange} keyboardType={keyboard ?? "default"} secureTextEntry={secure} autoCapitalize={keyboard === "email-address" ? "none" : "sentences"}
        backgroundColor={brand.bgSoft} borderColor={brand.borderStrong} color={brand.text} />
    </YStack>
  );
}
