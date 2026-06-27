import { Alert } from "react-native";
import { Link, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { YStack, XStack, Text, Button, Spinner } from "tamagui";
import { useAuth } from "../src/auth";
import { useColors } from "../src/theme";
import { errorMessage } from "../src/error";
import { RHFTextField, loginSchema, type LoginForm } from "../src/form";
import { BackButton, BrandLogo } from "../src/components";

export default function Login() {
  const brand = useColors();
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
      Alert.alert("Login failed", errorMessage(e, "Check your details and try again."));
    }
  }

  return (
    <YStack flex={1} backgroundColor={brand.bg} paddingTop={insets.top + 12}>
      <XStack paddingHorizontal={16} paddingBottom={10}>
        <BackButton onPress={() => router.back()} />
      </XStack>

      <YStack flex={1} padding={24} gap={18} justifyContent="center">
        <YStack alignItems="center" gap={6} marginBottom={6}>
          <BrandLogo />
          <Text fontSize={14} color={brand.gold} marginTop={6}>Har bite, yaad rahe!</Text>
          <Text fontSize={26} fontWeight="800" color={brand.text}>Welcome back</Text>
          <Text color={brand.muted}>Log in to order your favourite biryani.</Text>
        </YStack>

        <RHFTextField control={control} name="emailOrPhone" label="Email or phone" keyboard="email-address" error={errors.emailOrPhone?.message} />
        <RHFTextField control={control} name="password" label="Password" secure error={errors.password?.message} />

        <Button height={52} backgroundColor={brand.gold} color="#2a1a06" fontWeight="800" fontSize={16} disabled={isSubmitting} onPress={handleSubmit(onSubmit)}>
          {isSubmitting ? <Spinner color="#2a1a06" /> : "Log in"}
        </Button>

        <XStack justifyContent="center" gap={6}>
          <Text color={brand.muted}>New here?</Text>
          <Link href="/register" asChild>
            <Text color={brand.gold} fontWeight="800">Create an account</Text>
          </Link>
        </XStack>
      </YStack>
    </YStack>
  );
}
