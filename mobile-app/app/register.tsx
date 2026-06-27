import { useState } from "react";
import { Alert } from "react-native";
import { Link, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { YStack, XStack, Text, Button, Spinner } from "tamagui";
import { useAuth } from "../src/auth";
import { useColors } from "../src/theme";
import { errorMessage } from "../src/error";
import { RHFTextField, registerSchema, type RegisterForm } from "../src/form";
import { BackButton, BrandLogo } from "../src/components";

export default function Register() {
  const brand = useColors();
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
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
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
      Alert.alert("Couldn't send code", errorMessage(e, "Try again."));
    } finally {
      setBusy(false);
    }
  }

  async function onVerify(data: RegisterForm) {
    setBusy(true);
    try {
      await register(data.name.trim(), data.email.trim(), data.password, data.otp.trim());
      router.replace("/");
    } catch (e: unknown) {
      Alert.alert("Couldn't sign up", errorMessage(e, "Try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <YStack flex={1} backgroundColor={brand.bg} paddingTop={insets.top + 12}>
      <XStack paddingHorizontal={16} paddingBottom={10}>
        <BackButton onPress={() => (step === "verify" ? setStep("details") : router.back())} />
      </XStack>

      <YStack flex={1} padding={24} gap={16} justifyContent="center">
        <YStack alignItems="center" gap={4} marginBottom={6}>
          <BrandLogo />
          <Text fontSize={26} fontWeight="800" color={brand.text} marginTop={6}>Join the family</Text>
          <Text color={brand.muted}>
            {step === "details" ? "Create an account with your email." : `Enter the code sent to ${getValues("email")}.`}
          </Text>
        </YStack>

        {step === "details" ? (
          <>
            <RHFTextField control={control} name="name" label="Full name" error={errors.name?.message} />
            <RHFTextField control={control} name="email" label="Email" keyboard="email-address" error={errors.email?.message} />
            <RHFTextField control={control} name="password" label="Password (min 6 chars)" secure error={errors.password?.message} />
            <Button height={52} backgroundColor={brand.gold} color="#2a1a06" fontWeight="800" fontSize={16} disabled={busy} onPress={sendOtp}>
              {busy ? <Spinner color="#2a1a06" /> : "Send verification code"}
            </Button>
          </>
        ) : (
          <>
            <RHFTextField control={control} name="otp" label="6-digit code" keyboard="number-pad" error={errors.otp?.message} />
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
