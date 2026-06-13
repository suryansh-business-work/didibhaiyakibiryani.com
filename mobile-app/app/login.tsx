import { Alert } from "react-native";
import { Link, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useForm, Controller, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { YStack, XStack, Text, Button, Input, Spinner } from "tamagui";
import { useAuth } from "../src/auth";
import { brand } from "../src/theme";

const schema = z.object({
  emailOrPhone: z.string().trim().min(1, "Enter your email or phone"),
  password: z.string().min(1, "Enter your password"),
});
type FormData = z.infer<typeof schema>;

interface FieldProps {
  control: Control<FormData>;
  name: keyof FormData;
  label: string;
  error?: string;
  secure?: boolean;
}

function Field({ control, name, label, error, secure }: Readonly<FieldProps>) {
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
            autoCapitalize="none"
            keyboardType={name === "emailOrPhone" ? "email-address" : "default"}
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

export default function Login() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { emailOrPhone: "", password: "" },
  });

  async function onSubmit(data: FormData) {
    try {
      await login(data.emailOrPhone.trim(), data.password);
      router.replace("/");
    } catch (e: unknown) {
      Alert.alert("Login failed", e instanceof Error ? e.message : "Check your details and try again.");
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

        <Field control={control} name="emailOrPhone" label="Email or phone" error={errors.emailOrPhone?.message} />
        <Field control={control} name="password" label="Password" secure error={errors.password?.message} />

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
