import { XStack, Text } from "tamagui";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useColors, inr } from "../theme";
import { SpringUp } from "../animations";
import { MIcon } from "../components";

interface CartBarProps {
  count: number;
  subtotal: number;
  onPress: () => void;
}

export function CartBar({ count, subtotal, onPress }: Readonly<CartBarProps>) {
  const brand = useColors();
  const itemLabel = count > 1 ? "items" : "item";
  const tabBarHeight = useBottomTabBarHeight();

  return (
    <SpringUp bottom={tabBarHeight}>
      <XStack
        marginBottom={10}
        marginHorizontal={16}
        backgroundColor={brand.gold}
        borderRadius={14}
        paddingHorizontal={18}
        paddingVertical={14}
        alignItems="center"
        justifyContent="space-between"
        pressStyle={{ opacity: 0.9 }}
        onPress={onPress}
      >
        <Text color="#2a1a06" fontWeight="800">
          {count} {itemLabel} · {inr(subtotal)}
        </Text>
        <XStack alignItems="center" gap={4}>
          <Text color="#2a1a06" fontWeight="800">View cart</Text>
          <MIcon name="arrow-right" size={18} color="#2a1a06" />
        </XStack>
      </XStack>
    </SpringUp>
  );
}
