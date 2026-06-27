import { XStack, YStack, Text } from "tamagui";
import { useColors, STATUS_FLOW, STATUS_META, type Colors } from "../theme";
import { MIcon } from "../components";

function stepColor(active: boolean, done: boolean, c: Colors): string {
  if (active) return c.gold;
  if (done) return c.text;
  return c.muted;
}

/** Vertical status timeline (Placed → Delivered), or a cancelled state. */
export function OrderTimeline({ status }: Readonly<{ status: string }>) {
  const brand = useColors();
  const currentIdx = STATUS_FLOW.indexOf(status);

  if (status === "CANCELLED") {
    return (
      <YStack backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} borderRadius={16} padding={18}>
        <XStack gap={12} alignItems="center" paddingVertical={6}>
          <YStack width={26} height={26} borderRadius={999} backgroundColor={brand.red} alignItems="center" justifyContent="center">
            <MIcon name="close" size={16} color="#fff" />
          </YStack>
          <Text color={brand.red} fontWeight="800">Order cancelled</Text>
        </XStack>
      </YStack>
    );
  }

  return (
    <YStack backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} borderRadius={16} padding={18} gap={2}>
      {STATUS_FLOW.map((st, i) => {
        const done = i <= currentIdx;
        const active = i === currentIdx;
        return (
          <XStack key={st} gap={12} alignItems="center" minHeight={42}>
            <YStack alignItems="center">
              <YStack
                width={22} height={22} borderRadius={999}
                backgroundColor={done ? brand.gold : brand.cardSoft}
                borderColor={done ? brand.gold : brand.border} borderWidth={1}
                alignItems="center" justifyContent="center"
              >
                {done && <Text color="#2a1a06" fontSize={12} fontWeight="800">✓</Text>}
              </YStack>
              {i < STATUS_FLOW.length - 1 && <YStack width={2} height={20} backgroundColor={i < currentIdx ? brand.gold : brand.border} />}
            </YStack>
            <Text color={stepColor(active, done, brand)} fontWeight={active ? "800" : "600"}>{STATUS_META[st].label}</Text>
          </XStack>
        );
      })}
    </YStack>
  );
}
