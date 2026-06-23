import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { YStack, XStack, Text, Button, Spinner } from "tamagui";
import { useAuth } from "../src/auth";
import { brand } from "../src/theme";
import { RHFTextField, loginSchema, type LoginForm } from "../src/form";
import { BrandLogo } from "../src/ui";

export default function Login() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { emailOrPhone: "", password: "" },
  });

  async function onSubmit(data: LoginForm) {
    try {
      await login(data.emailOrPhone.trim(), data.password);
      router.replace("/");
    } catch (e: unknown) {
      Alert.alert("Login failed", e instanceof Error ? e.message : "Check your details and try again.");
    }
  }

  return (
    <YStack flex={1} backgroundColor={brand.bg} paddingTop={insets.top + 24} padding={24} justifyContent="center" gap={18}>
      <YStack alignItems="center" gap={6} marginBottom={6}>
        <BrandLogo />
        <Text fontSize={14} color={brand.gold} marginTop={6}>Didi Bhaiya · Delivery</Text>
        <Text fontSize={26} fontWeight="800" color={brand.text}>Rider sign in</Text>
        <Text color={brand.muted}>Your assigned orders are waiting.</Text>
      </YStack>

      <RHFTextField control={control} name="emailOrPhone" label="Email or phone" keyboard="email-address" error={errors.emailOrPhone?.message} />
      <RHFTextField control={control} name="password" label="Password" secure error={errors.password?.message} />

      <Button height={52} backgroundColor={brand.gold} color="#2a1a06" fontWeight="800" fontSize={16} disabled={isSubmitting} onPress={handleSubmit(onSubmit)}>
        {isSubmitting ? <Spinner color="#2a1a06" /> : "Sign in"}
      </Button>

      <XStack justifyContent="center">
        <Text fontSize={12} color={brand.faint} textAlign="center">
          No account? Ask the admin to add you under Riders.
        </Text>
      </XStack>
    </YStack>
  );
}
