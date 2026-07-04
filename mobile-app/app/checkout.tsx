import { useState } from "react";
import { ScrollView } from "react-native";
import { useLazyQuery, useMutation } from "@apollo/client";
import { useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack, XStack, Text, Button, Input, Spinner } from "tamagui";
import { VALIDATE_COUPON, PLACE_ORDER } from "../src/graphql";
import { useCart } from "../src/cart";
import { useAuth } from "../src/auth";
import { useFulfilment } from "../src/fulfilment";
import { useSettings, previewDeliveryFee } from "../src/settings";
import { Section, PayOption, Row, Notice } from "../src/checkout/fields";
import { SocietyPicker, type Society } from "../src/checkout/SocietyPicker";
import { RHFTextField, BlockPicker, checkoutAddressSchema, type CheckoutAddressForm } from "../src/form";
import { BackButton, MIcon } from "../src/components";
import { useColors, inr } from "../src/theme";
import { errorMessage } from "../src/error";

export default function Checkout() {
  const brand = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { lines, subtotal, clear } = useCart();
  const { orderType } = useFulfilment();
  const isTakeaway = orderType === "TAKEAWAY";
  const settings = useSettings();

  const def = user?.addresses?.find((a) => a.isDefault) ?? user?.addresses?.[0];
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(def?.id ?? null);
  const [society, setSociety] = useState<Society | null>(null);
  const defaultPayment = settings.codEnabled ? "COD" : "ONLINE";
  const [payment, setPayment] = useState<"COD" | "ONLINE">(defaultPayment);
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");

  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [freeDelivery, setFreeDelivery] = useState(false);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [couponMsg, setCouponMsg] = useState("");

  const {
    control,
    watch,
    setValue,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<CheckoutAddressForm>({
    resolver: zodResolver(checkoutAddressSchema),
    defaultValues: { societyId: "", flatNumber: "", block: "", phone: user?.phone ?? "" },
  });

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

  const baseDelivery = isTakeaway ? 0 : previewDeliveryFee(subtotal, settings);
  const effDelivery = freeDelivery ? 0 : baseDelivery;
  const total = Math.max(0, subtotal - discount) + effDelivery;
  const noPaymentMethod = !settings.codEnabled && !settings.onlineEnabled;
  const blocked = !settings.storeOpenNow || noPaymentMethod;

  function pickSociety(s: Society) {
    setSociety(s);
    setValue("societyId", s.id, { shouldValidate: true });
    setSelectedSavedId(null);
  }
  function selectSaved(id: string) {
    setSelectedSavedId(id);
    setSociety(null);
    setValue("societyId", "");
    setValue("flatNumber", "");
    setValue("block", "");
  }

  async function apply() {
    if (!code.trim()) return;
    setCouponMsg("");
    try {
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
    } catch (e: unknown) {
      setCouponMsg(errorMessage(e, "Couldn't check that coupon. Try again."));
    }
  }

  async function resolveAddress() {
    if (selectedSavedId) {
      if (!(await trigger("phone"))) return null;
      const a = user?.addresses?.find((x) => x.id === selectedSavedId);
      if (!a) return null;
      return { label: a.label, line1: a.line1, line2: a.line2, city: a.city, pincode: a.pincode || "", phone: getValues("phone") };
    }
    if (!(await trigger())) return null;
    if (!society) return null;
    const d = getValues();
    return { label: "Home", line1: `Flat ${d.flatNumber.trim()}, Block ${d.block}`, line2: society.area, city: society.name, pincode: society.pincode || "", phone: d.phone };
  }

  async function submit() {
    setFormError("");
    const address = await resolveAddress();
    if (!address) return;
    try {
      const { data } = await placeOrder({
        variables: {
          input: {
            items: lines.map((l) => ({ menuItemId: l.id, qty: l.qty, spiceLevel: l.spiceLevel })),
            address,
            couponCode: appliedCode || null,
            paymentMethod: payment,
            orderType,
            notes,
          },
        },
      });
      clear();
      router.replace(`/order/${data.placeOrder.id}`);
    } catch (e: unknown) {
      setFormError(errorMessage(e, "Couldn't place the order — please try again."));
    }
  }

  return (
    <YStack flex={1} backgroundColor={brand.bg}>
      <XStack paddingTop={insets.top + 8} paddingHorizontal={16} paddingBottom={10} alignItems="center" gap={12}>
        <BackButton onPress={() => router.back()} />
        <Text fontSize={22} fontWeight="800" color={brand.text}>Checkout</Text>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 20 }}>
        {!settings.storeOpenNow && (
          <Notice kind="warn">
            We're closed right now — open {settings.storeOpenTime}–{settings.storeCloseTime}. You can place your order once we're open.
          </Notice>
        )}

        <Section title="Delivery address">
          {user?.addresses && user.addresses.length > 0 && (
            <>
              <YStack gap={8}>
                {user.addresses.map((a) => (
                  <Button
                    key={a.id}
                    height="auto"
                    paddingVertical={12}
                    paddingHorizontal={14}
                    backgroundColor={selectedSavedId === a.id ? "rgba(228,182,92,0.16)" : brand.card}
                    borderColor={selectedSavedId === a.id ? brand.goldDeep : brand.border}
                    borderWidth={1}
                    pressStyle={{ opacity: 0.9 }}
                    onPress={() => selectSaved(a.id)}
                  >
                    <YStack gap={4} width="100%">
                      <Text color={selectedSavedId === a.id ? brand.gold : brand.text} fontWeight="700" fontSize={13}>{a.label}</Text>
                      <Text color={selectedSavedId === a.id ? brand.dim : brand.muted} fontSize={12}>{a.line1}</Text>
                      <Text color={brand.muted} fontSize={11}>{a.city}{a.pincode ? ` — ${a.pincode}` : ""}</Text>
                    </YStack>
                  </Button>
                ))}
              </YStack>
              <Text color={brand.muted} fontSize={12} marginVertical={8}>Or deliver to another society:</Text>
            </>
          )}
          <SocietyPicker selectedId={selectedSavedId ? null : watch("societyId") || null} onSelect={pickSociety} />
          {!selectedSavedId && errors.societyId ? <Text fontSize={12} color={brand.red}>{errors.societyId.message}</Text> : null}
          {!selectedSavedId && (
            <>
              <RHFTextField control={control} name="flatNumber" label="Flat number" keyboard="number-pad" error={errors.flatNumber?.message} />
              <BlockPicker label="Block" value={watch("block") ?? ""} onChange={(b) => setValue("block", b, { shouldValidate: true })} error={errors.block?.message} />
            </>
          )}
          <RHFTextField control={control} name="phone" label="Phone" keyboard="phone-pad" error={errors.phone?.message} />
          <Button borderColor={brand.border} borderWidth={1} color={brand.gold} fontWeight="700" onPress={() => router.push("./addresses")}
            icon={<MIcon name="map-marker-outline" size={16} color={brand.gold} />}>
            Manage addresses
          </Button>
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
          <Row k={isTakeaway ? "Pickup" : "Delivery"} v={isTakeaway || effDelivery === 0 ? "Free" : inr(effDelivery)} />
          <YStack height={1} backgroundColor={brand.border} marginVertical={4} />
          <Row k="To pay" v={inr(total)} strong />
        </YStack>

        {formError ? <Notice kind="error">{formError}</Notice> : null}
      </ScrollView>

      <XStack paddingHorizontal={16} paddingBottom={insets.bottom + 12} paddingTop={12} backgroundColor={brand.bg} borderTopColor={brand.border} borderTopWidth={1}>
        <Button flex={1} height={52} backgroundColor={brand.gold} color="#2a1a06" fontWeight="800" fontSize={16}
          disabled={placing || lines.length === 0 || blocked} opacity={blocked ? 0.6 : 1} onPress={submit}>
          {placing ? <Spinner color="#2a1a06" /> : `Place order · ${inr(total)}`}
        </Button>
      </XStack>
    </YStack>
  );
}
