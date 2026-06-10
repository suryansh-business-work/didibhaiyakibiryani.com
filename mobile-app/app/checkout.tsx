import { useState } from "react";
import { ScrollView } from "react-native";
import { useLazyQuery, useMutation } from "@apollo/client";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack, XStack, Text, Button, Input, Spinner } from "tamagui";
import { VALIDATE_COUPON, PLACE_ORDER } from "../src/graphql";
import { useCart } from "../src/cart";
import { useAuth } from "../src/auth";
import { useSettings, previewDeliveryFee } from "../src/settings";
import { Section, Field, PayOption, Row, Notice } from "../src/checkout/fields";
import { brand, inr } from "../src/theme";

export default function Checkout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { lines, subtotal, clear } = useCart();
  const settings = useSettings();

  const def = user?.addresses?.find((a) => a.isDefault) ?? user?.addresses?.[0];
  const [line1, setLine1] = useState(def?.line1 ?? "");
  const [line2, setLine2] = useState(def?.line2 ?? "");
  const [city, setCity] = useState(def?.city ?? "");
  const [pincode, setPincode] = useState(def?.pincode ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const defaultPayment = settings.codEnabled ? "COD" : "ONLINE";
  const [payment, setPayment] = useState<"COD" | "ONLINE">(defaultPayment);
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");

  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [freeDelivery, setFreeDelivery] = useState(false);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [couponMsg, setCouponMsg] = useState("");

  const [validate, { loading: validating }] = useLazyQuery(VALIDATE_COUPON, { fetchPolicy: "network-only" });
  const [placeOrder, { loading: placing }] = useMutation(PLACE_ORDER);

  if (!authLoading && !user) {
    return (
      <YStack flex={1} backgroundColor={brand.bg} alignItems="center" justifyContent="center" padding={28} gap={14}>
        <Text fontSize={20} fontWeight="800" color={brand.text}>Please log in to check out</Text>
        <Button backgroundColor={brand.gold} color="#2a1a06" fontWeight="800" onPress={() => router.replace("/login")}>Log in</Button>
        <Button chromeless color={brand.dim} onPress={() => router.back()}>Go back</Button>
      </YStack>
    );
  }

  const baseDelivery = previewDeliveryFee(subtotal, settings);
  const effDelivery = freeDelivery ? 0 : baseDelivery;
  const total = Math.max(0, subtotal - discount) + effDelivery;
  const noPaymentMethod = !settings.codEnabled && !settings.onlineEnabled;
  const blocked = !settings.storeOpenNow || noPaymentMethod;

  async function apply() {
    if (!code.trim()) return;
    setCouponMsg("");
    const { data } = await validate({ variables: { code: code.trim().toUpperCase(), subtotal } });
    const res = data?.validateCoupon;
    if (res?.valid) {
      setDiscount(res.discount ?? 0);
      setFreeDelivery(res.coupon?.type === "FREE_DELIVERY");
      setAppliedCode(code.trim().toUpperCase());
      setCouponMsg(res.message);
    } else {
      setDiscount(0);
      setFreeDelivery(false);
      setAppliedCode(null);
      setCouponMsg(res?.message ?? "Invalid coupon.");
    }
  }

  async function submit() {
    setFormError("");
    if (!line1 || !city || !pincode) {
      setFormError("Address line, city and pincode are required.");
      return;
    }
    try {
      const { data } = await placeOrder({
        variables: {
          input: {
            items: lines.map((l) => ({ menuItemId: l.id, qty: l.qty, spiceLevel: l.spiceLevel })),
            address: { label: "Home", line1, line2, city, pincode, phone },
            couponCode: appliedCode || null,
            paymentMethod: payment,
            notes,
          },
        },
      });
      clear();
      router.replace(`/order/${data.placeOrder.id}`);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Couldn't place the order — please try again.");
    }
  }

  return (
    <YStack flex={1} backgroundColor={brand.bg}>
      <XStack paddingTop={insets.top + 8} paddingHorizontal={16} paddingBottom={10} alignItems="center" gap={12}>
        <Button size="$3" circular backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} color={brand.text} onPress={() => router.back()}>‹</Button>
        <Text fontSize={22} fontWeight="800" color={brand.text}>Checkout</Text>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 20 }}>
        {!settings.storeOpenNow && (
          <Notice kind="warn">
            We're closed right now — open {settings.storeOpenTime}–{settings.storeCloseTime}. You can place your order once we're open.
          </Notice>
        )}

        <Section title="Delivery address">
          <Field label="Flat / House / Street" value={line1} onChange={setLine1} />
          <Field label="Landmark (optional)" value={line2} onChange={setLine2} />
          <XStack gap={10}>
            <YStack flex={1}><Field label="City" value={city} onChange={setCity} /></YStack>
            <YStack flex={1}><Field label="Pincode" value={pincode} onChange={setPincode} keyboard="number-pad" /></YStack>
          </XStack>
          <Field label="Phone" value={phone} onChange={setPhone} keyboard="phone-pad" />
        </Section>

        <Section title="Coupon">
          <XStack gap={8}>
            <Input flex={1} value={code} onChangeText={setCode} placeholder="Enter code (e.g. BIRYANI50)" autoCapitalize="characters"
              backgroundColor={brand.bgSoft} borderColor={brand.borderStrong} color={brand.text} placeholderTextColor={brand.faint} />
            <Button backgroundColor="rgba(228,182,92,0.12)" borderColor={brand.gold} borderWidth={1} color={brand.gold} fontWeight="800" onPress={apply} disabled={validating}>
              {validating ? "…" : "Apply"}
            </Button>
          </XStack>
          {couponMsg ? <Text fontSize={12} color={appliedCode ? brand.green : brand.red}>{couponMsg}</Text> : null}
        </Section>

        <Section title="Payment">
          {noPaymentMethod ? (
            <Notice kind="error">Payments are temporarily unavailable — please try again later.</Notice>
          ) : (
            <XStack gap={10}>
              {settings.codEnabled && (
                <PayOption label="Cash on delivery" active={payment === "COD"} onPress={() => setPayment("COD")} />
              )}
              {settings.onlineEnabled && (
                <PayOption label="Pay online" active={payment === "ONLINE"} onPress={() => setPayment("ONLINE")} />
              )}
            </XStack>
          )}
        </Section>

        <Section title="Cooking / delivery notes">
          <Input value={notes} onChangeText={setNotes} placeholder="e.g. ring the bell, extra raita" multiline numberOfLines={2}
            backgroundColor={brand.bgSoft} borderColor={brand.borderStrong} color={brand.text} placeholderTextColor={brand.faint} />
        </Section>

        <YStack backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} borderRadius={14} padding={16} gap={8}>
          <Row k="Subtotal" v={inr(subtotal)} />
          {discount > 0 && <Row k={`Discount (${appliedCode})`} v={`– ${inr(discount)}`} />}
          <Row k="Delivery" v={effDelivery === 0 ? "Free" : inr(effDelivery)} />
          <YStack height={1} backgroundColor={brand.border} marginVertical={4} />
          <Row k="To pay" v={inr(total)} strong />
        </YStack>

        {formError ? <Notice kind="error">{formError}</Notice> : null}
      </ScrollView>

      <XStack paddingHorizontal={16} paddingBottom={insets.bottom + 12} paddingTop={12} backgroundColor="#0c0805" borderTopColor={brand.border} borderTopWidth={1}>
        <Button flex={1} height={52} backgroundColor={brand.gold} color="#2a1a06" fontWeight="800" fontSize={16}
          disabled={placing || lines.length === 0 || blocked} opacity={blocked ? 0.6 : 1} onPress={submit}>
          {placing ? <Spinner color="#2a1a06" /> : `Place order · ${inr(total)}`}
        </Button>
      </XStack>
    </YStack>
  );
}
