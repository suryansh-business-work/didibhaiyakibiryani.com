import { XStack, Text } from "tamagui";
import { useColors } from "../theme";
import { useSettings } from "../settings";
import { DropIn } from "../animations";

/** Shown when the store is outside its admin-configured opening hours. */
export function StoreClosedBanner() {
  const brand = useColors();
  const settings = useSettings();
  if (settings.storeOpenNow) return null;

  return (
    <DropIn>
      <XStack
        marginHorizontal={14}
        marginBottom={10}
        backgroundColor="rgba(224,88,75,0.12)"
        borderColor="rgba(224,88,75,0.4)"
        borderWidth={1}
        borderRadius={12}
        paddingHorizontal={14}
        paddingVertical={10}
        alignItems="center"
        gap={10}
      >
        <Text fontSize={16}>🌙</Text>
        <Text color={brand.red} fontWeight="700" fontSize={13} flex={1}>
          We're closed right now — open {settings.storeOpenTime}–{settings.storeCloseTime}.
          Browse the menu and come back hungry!
        </Text>
      </XStack>
    </DropIn>
  );
}
