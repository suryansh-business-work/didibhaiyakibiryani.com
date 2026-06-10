import { XStack, Text } from "tamagui";
import { brand, inr } from "../theme";
import { SpringUp } from "../animations";

interface CartBarProps {
  count: number;
  subtotal: number;
  onPress: () => void;
}

export function CartBar({ count, subtotal, onPress }: Readonly<CartBarProps>) {
  const itemLabel = count > 1 ? "items" : "item";

  return (
    <SpringUp>
      <XStack
        marginBottom={16}
        marginHorizontal={16}
        backgroundColor={brand.gold}
        borderRadius={14}
        paddingHorizontal={18}
        paddingVertical={14}
        alignItems="center"
        justifyContent="space-between"
        pressStyle={{ opacity: 0.9, scale: 0.98 }}
        onPress={onPress}
      >
        <Text color="#2a1a06" fontWeight="800">
          {count} {itemLabel} · {inr(subtotal)}
        </Text>
        <Text color="#2a1a06" fontWeight="800">
          View cart →
        </Text>
      </XStack>
    </SpringUp>
  );
}
