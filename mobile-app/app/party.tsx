import { useState } from "react";
import { ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "@apollo/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack, XStack, Text, Button, Spinner } from "tamagui";
import { CAPTCHA, SUBMIT_PARTY_ORDER } from "../src/graphql";
import { useAuth } from "../src/auth";
import { brand } from "../src/theme";
import { Section, Notice } from "../src/checkout/fields";
import { RHFTextField, DateTimeField, partySchema, type PartyForm } from "../src/form";
import { BackButton, MIcon } from "../src/components";

export default function PartyOrder() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const {
    control,
    handleSubmit,
    setError,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PartyForm>({
    resolver: zodResolver(partySchema),
    defaultValues: {
      name: user?.name ?? "",
      phone: user?.phone ?? "",
      email: user?.email ?? "",
      eventDate: "",
      guests: "",
      location: "",
      message: "",
      captchaAnswer: "",
    },
  });

  const [done, setDone] = useState(false);
  const { data: captchaData, refetch: refetchCaptcha } = useQuery<{ captcha: { id: string; question: string } }>(
    CAPTCHA,
    { fetchPolicy: "network-only" }
  );
  const [submit, { loading }] = useMutation(SUBMIT_PARTY_ORDER);
  const captcha = captchaData?.captcha;

  async function onSubmit(data: PartyForm) {
    if (!captcha?.id) {
      setError("captchaAnswer", { message: "Captcha unavailable — please refresh." });
      return;
    }
    try {
      await submit({
        variables: {
          input: {
            name: data.name.trim(),
            phone: data.phone.trim(),
            email: data.email.trim(),
            eventDate: data.eventDate?.trim() || undefined,
            guests: data.guests?.trim() ? Number(data.guests.trim()) : undefined,
            location: data.location?.trim() || undefined,
            message: data.message?.trim() || undefined,
          },
          captchaId: captcha.id,
          captchaAnswer: data.captchaAnswer.trim(),
        },
      });
      setDone(true);
    } catch (e: unknown) {
      setError("captchaAnswer", {
        message: e instanceof Error ? e.message : "Couldn't send — please try again.",
      });
      await refetchCaptcha();
    }
  }

  return (
    <YStack flex={1} backgroundColor={brand.bg}>
      <XStack paddingTop={insets.top + 8} paddingHorizontal={16} paddingBottom={10} alignItems="center" gap={12}>
        <BackButton onPress={() => router.back()} />
        <Text fontSize={22} fontWeight="800" color={brand.text}>Plan a party order</Text>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: insets.bottom + 24 }}>
        {done ? (
          <YStack gap={16} alignItems="center" paddingVertical={30}>
            <MIcon name="party-popper" size={48} color={brand.gold} />
            <Text fontSize={18} fontWeight="800" color={brand.text} textAlign="center">Request received!</Text>
            <Text color={brand.muted} textAlign="center">Our catering team will reach out to you shortly. We've also emailed you a confirmation.</Text>
            <Button backgroundColor={brand.gold} color="#2a1a06" fontWeight="800" onPress={() => router.back()}>Done</Button>
          </YStack>
        ) : (
          <>
            <Text color={brand.muted} fontSize={13}>
              Birthdays, office lunches, pujas and big dawats — tell us what you need and we'll plan the handi.
            </Text>

            <Section title="Your details">
              <RHFTextField control={control} name="name" label="Name" error={errors.name?.message} />
              <RHFTextField control={control} name="phone" label="Phone" keyboard="phone-pad" error={errors.phone?.message} />
              <RHFTextField control={control} name="email" label="Email" keyboard="email-address" error={errors.email?.message} />
            </Section>

            <Section title="Party details">
              <DateTimeField
                label="Event date & time"
                value={watch("eventDate") ?? ""}
                onChange={(v) => setValue("eventDate", v, { shouldValidate: true })}
                error={errors.eventDate?.message}
              />
              <RHFTextField control={control} name="guests" label="Approx. guests" keyboard="number-pad" error={errors.guests?.message} />
              <RHFTextField control={control} name="location" label="Location / society" error={errors.location?.message} />
              <RHFTextField control={control} name="message" label="Anything else? (menu, budget, timing)" multiline error={errors.message?.message} />
            </Section>

            <Section title={`Captcha: ${captcha?.question ?? "…"}`}>
              <RHFTextField control={control} name="captchaAnswer" label="Your answer" keyboard="number-pad" error={errors.captchaAnswer?.message} />
            </Section>

            {errors.root ? <Notice kind="error">{errors.root.message}</Notice> : null}

            <Button height={52} backgroundColor={brand.gold} color="#2a1a06" fontWeight="800" fontSize={16} disabled={loading} onPress={handleSubmit(onSubmit)}>
              {loading ? <Spinner color="#2a1a06" /> : "Send request"}
            </Button>
          </>
        )}
      </ScrollView>
    </YStack>
  );
}
