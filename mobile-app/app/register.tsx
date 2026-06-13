import { useState } from "react";
import { Alert } from "react-native";
import { Link, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useForm, Controller, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { YStack, XStack, Text, Button, Input, Spinner } from "tamagui";
import { useAuth } from "../src/auth";
import { brand } from "../src/theme";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const schema = z.object({
  name: z.string().trim().min(1, "Enter your name"),
  email: z.string().trim().regex(EMAIL_RE, "Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
  otp: z.string().trim().length(6, "Enter the 6-digit code"),
});
type FormData = z.infer<typeof schema>;

interface FieldProps {
  control: Control<FormData>;
  name: keyof FormData;
  label: string;
  error?: string;
  secure?: boolean;
  keyboard?: "default" | "email-address" | "number-pad";
}

function Field({ control, name, label, error, secure, keyboard }: Readonly<FieldProps>) {
  return (
    <YStack gap={6}>
      <Text fontSize={12} color={brand.muted} fontWeight="700">{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            secureTextEntry={secure}
            keyboardType={keyboard ?? "default"}
            autoCapitalize={keyboard === "email-address" ? "none" : "sentences"}
            backgroundColor={brand.bgSoft}
            borderColor={error ? brand.red : brand.borderStrong}
            color={brand.text}
          />
        )}
      />
      {error ? <Text fontSize={12} color={brand.red}>{error}</Text> : null}
    </YStack>
  );
}

export default function Register() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { requestSignupOtp, register } = useAuth();
  const [step, setStep] = useState<"details" | "verify">("details");
  const [busy, setBusy] = useState(false);
  const {
    control,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", otp: "" },
  });

  async function sendOtp() {
    const ok = await trigger(["name", "email", "password"]);
    if (!ok) return;
    setBusy(true);
    try {
      const { name, email } = getValues();
      await requestSignupOtp(name.trim(), email.trim());
      setStep("verify");
    } catch (e: unknown) {
      Alert.alert("Couldn't send code", e instanceof Error ? e.message : "Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onVerify(data: FormData) {
    setBusy(true);
    try {
      await register(data.name.trim(), data.email.trim(), data.password, data.otp.trim());
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
            {step === "details" ? "Create an account with your email." : `Enter the code sent to ${getValues("email")}.`}
          </Text>
        </YStack>

        {step === "details" ? (
          <>
            <Field control={control} name="name" label="Full name" error={errors.name?.message} />
            <Field control={control} name="email" label="Email" keyboard="email-address" error={errors.email?.message} />
            <Field control={control} name="password" label="Password (min 6 chars)" secure error={errors.password?.message} />
            <Button height={52} backgroundColor={brand.gold} color="#2a1a06" fontWeight="800" fontSize={16} disabled={busy} onPress={sendOtp}>
              {busy ? <Spinner color="#2a1a06" /> : "Send verification code"}
            </Button>
          </>
        ) : (
          <>
            <Field control={control} name="otp" label="6-digit code" keyboard="number-pad" error={errors.otp?.message} />
            <Button height={52} backgroundColor={brand.gold} color="#2a1a06" fontWeight="800" fontSize={16} disabled={busy} onPress={handleSubmit(onVerify)}>
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
