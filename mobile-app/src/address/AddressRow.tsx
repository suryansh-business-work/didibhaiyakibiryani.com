import { XStack, YStack, Text, Button } from "tamagui";
import { useColors } from "../theme";
import { MIcon } from "../components";

export interface SavedAddress {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  pincode?: string;
  isDefault: boolean;
}

/** One saved delivery address. Tapping the card selects it as the active
 *  delivery location; the trash button removes it. The active address is
 *  highlighted with a gold border + "Delivering here". */
export function AddressRow({
  address,
  removing,
  onSelect,
  onDelete,
}: Readonly<{ address: SavedAddress; removing: boolean; onSelect: () => void; onDelete: () => void }>) {
  const brand = useColors();
  const active = address.isDefault;
  return (
    <XStack
      backgroundColor={active ? "rgba(228,182,92,0.12)" : brand.card}
      borderColor={active ? brand.gold : brand.border}
      borderWidth={1}
      borderRadius={12}
      padding={14}
      gap={12}
      alignItems="flex-start"
    >
      <XStack flex={1} gap={12} alignItems="flex-start" pressStyle={{ opacity: 0.85 }} onPress={onSelect}>
        <YStack width={34} height={34} borderRadius={999} backgroundColor={active ? brand.gold : brand.maroonSoft} alignItems="center" justifyContent="center">
          <MIcon name={active ? "check" : "map-marker-outline"} size={18} color={active ? brand.onGold : brand.gold} />
        </YStack>
        <YStack flex={1} gap={2}>
          <XStack gap={8} alignItems="center">
            <Text fontWeight="800" color={brand.text}>{address.label}</Text>
            {active && (
              <Text fontSize={11} fontWeight="800" color={brand.gold} backgroundColor="rgba(228,182,92,0.2)" paddingHorizontal={6} paddingVertical={2} borderRadius={4}>Delivering here</Text>
            )}
          </XStack>
          <Text fontSize={13} color={brand.dim}>{address.line1}{address.line2 ? `, ${address.line2}` : ""}</Text>
          <Text fontSize={12} color={brand.muted}>{address.city}{address.pincode ? ` — ${address.pincode}` : ""}</Text>
        </YStack>
      </XStack>
      <Button size="$2" circular backgroundColor="rgba(224,88,75,0.12)" borderColor="rgba(224,88,75,0.4)" borderWidth={1} disabled={removing} onPress={onDelete}>
        <MIcon name="trash-can-outline" size={16} color={brand.red} />
      </Button>
    </XStack>
  );
}
