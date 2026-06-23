import { XStack, YStack, Text } from "tamagui";
import { brand } from "../theme";
import { MIcon } from "../components";
import { useSettings } from "../settings";
import { FadeInView } from "../animations";
import { HERO_STATS } from "../config";

interface HomeHeaderProps {
  count: number;
  paddingTop: number;
  onOpenCart: () => void;
}

export function HomeHeader({ count, paddingTop, onOpenCart }: Readonly<HomeHeaderProps>) {
  const settings = useSettings();

  return (
    <YStack
      paddingTop={paddingTop}
      paddingHorizontal={18}
      paddingBottom={12}
      backgroundColor="#0c0805"
    >
      <FadeInView>
        <XStack alignItems="center" justifyContent="space-between">
          <YStack>
            <Text fontSize={13} color={brand.gold} fontFamily="$body">
              {settings.tagline}
            </Text>
            <Text fontSize={22} fontWeight="800" color={brand.text}>
              {settings.brandName}
            </Text>
          </YStack>
          <CartButton count={count} onPress={onOpenCart} />
        </XStack>
        <XStack marginTop={10} gap={14}>
          {HERO_STATS.map((stat) => (
            <YStack key={stat.id}>
              <Text fontSize={15} fontWeight="800" color={brand.text}>
                {stat.big}
              </Text>
              <Text fontSize={10} color={brand.muted}>
                {stat.small}
              </Text>
            </YStack>
          ))}
        </XStack>
      </FadeInView>
    </YStack>
  );
}

function CartButton({ count, onPress }: Readonly<{ count: number; onPress: () => void }>) {
  return (
    <YStack
      width={44}
      height={44}
      borderRadius={12}
      backgroundColor={brand.card}
      borderColor={brand.border}
      borderWidth={1}
      alignItems="center"
      justifyContent="center"
      pressStyle={{ opacity: 0.8, scale: 0.94 }}
      onPress={onPress}
    >
      <MIcon name="cart-outline" size={20} color={brand.text} />
      {count > 0 && (
        <YStack
          position="absolute"
          top={-6}
          right={-6}
          backgroundColor={brand.red}
          borderRadius={999}
          minWidth={18}
          height={18}
          alignItems="center"
          justifyContent="center"
          paddingHorizontal={4}
        >
          <Text color="#fff" fontSize={10} fontWeight="800">
            {count}
          </Text>
        </YStack>
      )}
    </YStack>
  );
}
