import { XStack, YStack, Text } from "tamagui";
import { useColors, inr } from "../theme";
import { SPICE_LABELS } from "../components";

interface BillItem { name: string; price: number; qty: number; spiceLevel?: number }

interface Props {
  items: BillItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  couponCode?: string;
  paymentMethod: string;
}

function Row({ k, v, strong }: Readonly<{ k: string; v: string; strong?: boolean }>) {
  const brand = useColors();
  return (
    <XStack justifyContent="space-between">
      <Text color={strong ? brand.text : brand.dim} fontWeight={strong ? "800" : "400"} fontSize={strong ? 16 : 14}>{k}</Text>
      <Text color={strong ? brand.gold : brand.dim} fontWeight={strong ? "800" : "600"} fontSize={strong ? 16 : 14}>{v}</Text>
    </XStack>
  );
}

/** Items list + bill breakdown (subtotal, discount, delivery, total, payment). */
export function OrderBill({ items, subtotal, discount, deliveryFee, total, couponCode, paymentMethod }: Readonly<Props>) {
  const brand = useColors();
  return (
    <YStack backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} borderRadius={16} padding={16} gap={10}>
      <Text fontWeight="800" color={brand.text}>Order summary</Text>
      {items.map((it) => (
        <XStack key={`${it.name}-${it.spiceLevel ?? 0}`} justifyContent="space-between">
          <Text color={brand.dim} flex={1}>
            {it.qty}× {it.name}{it.spiceLevel ? ` · ${SPICE_LABELS[it.spiceLevel]}` : ""}
          </Text>
          <Text color={brand.dim}>{inr(it.price * it.qty)}</Text>
        </XStack>
      ))}
      <YStack height={1} backgroundColor={brand.border} marginVertical={4} />
      <Row k="Subtotal" v={inr(subtotal)} />
      {discount > 0 && <Row k={`Discount ${couponCode ? `(${couponCode})` : ""}`} v={`– ${inr(discount)}`} />}
      <Row k="Delivery" v={deliveryFee === 0 ? "Free" : inr(deliveryFee)} />
      <Row k="Total" v={inr(total)} strong />
      <Text fontSize={12} color={brand.muted} marginTop={4}>Payment · {paymentMethod === "COD" ? "Cash on delivery" : "Paid online"}</Text>
    </YStack>
  );
}
