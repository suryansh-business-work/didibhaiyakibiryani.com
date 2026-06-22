import { useState } from "react";
import { ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "@apollo/client";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack, XStack, Text, Button, Spinner } from "tamagui";
import { CAPTCHA, SUBMIT_PARTY_ORDER } from "../src/graphql";
import { useAuth } from "../src/auth";
import { brand } from "../src/theme";
import { Section, Field, Notice } from "../src/checkout/fields";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PartyOrder() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [eventDate, setEventDate] = useState("");
  const [guests, setGuests] = useState("");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const { data: captchaData, refetch: refetchCaptcha } = useQuery<{ captcha: { id: string; question: string } }>(
    CAPTCHA,
    { fetchPolicy: "network-only" }
  );
  const [submit, { loading }] = useMutation(SUBMIT_PARTY_ORDER);
  const captcha = captchaData?.captcha;

  async function resetCaptcha() {
    setAnswer("");
    await refetchCaptcha();
  }

  async function send() {
    setError("");
    if (!name.trim() || !phone.trim() || !email.trim()) {
      setError("Name, phone and email are required.");
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!captcha?.id || !answer.trim()) {
      setError("Please solve the captcha.");
      return;
    }
    try {
      await submit({
        variables: {
          input: {
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
            eventDate: eventDate.trim() || undefined,
            guests: guests.trim() ? Number(guests.trim()) : undefined,
            location: location.trim() || undefined,
            message: message.trim() || undefined,
          },
          captchaId: captcha.id,
          captchaAnswer: answer.trim(),
        },
      });
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Couldn't send — please try again.");
      await resetCaptcha();
    }
  }

  return (
    <YStack flex={1} backgroundColor={brand.bg}>
      <XStack paddingTop={insets.top + 8} paddingHorizontal={16} paddingBottom={10} alignItems="center" gap={12}>
        <Button size="$3" circular backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} color={brand.text} onPress={() => router.back()}>‹</Button>
        <Text fontSize={22} fontWeight="800" color={brand.text}>Plan a party order</Text>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: insets.bottom + 24 }}>
        {done ? (
          <YStack gap={16} alignItems="center" paddingVertical={30}>
            <Text fontSize={44}>🎉</Text>
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
              <Field label="Name" value={name} onChange={setName} />
              <Field label="Phone" value={phone} onChange={setPhone} keyboard="phone-pad" />
              <Field label="Email" value={email} onChange={setEmail} />
            </Section>

            <Section title="Party details">
              <Field label="Event date (e.g. 15 Aug)" value={eventDate} onChange={setEventDate} />
              <Field label="Approx. guests" value={guests} onChange={setGuests} keyboard="number-pad" />
              <Field label="Location / society" value={location} onChange={setLocation} />
              <Field label="Anything else? (menu, budget, timing)" value={message} onChange={setMessage} />
            </Section>

            <Section title={`Captcha: ${captcha?.question ?? "…"}`}>
              <Field label="Your answer" value={answer} onChange={setAnswer} keyboard="number-pad" />
            </Section>

            {error ? <Notice kind="error">{error}</Notice> : null}

            <Button height={52} backgroundColor={brand.gold} color="#2a1a06" fontWeight="800" fontSize={16} disabled={loading} onPress={send}>
              {loading ? <Spinner color="#2a1a06" /> : "Send request"}
            </Button>
          </>
        )}
      </ScrollView>
    </YStack>
  );
}
