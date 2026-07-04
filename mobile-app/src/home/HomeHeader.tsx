import { XStack, YStack, Text } from "tamagui";
import { Image } from "expo-image";
import { useColors } from "../theme";
import { MIcon } from "../components";
import { FadeInView } from "../animations";

interface HomeHeaderProps {
  location: string;
  initial: string;
  avatarUri?: string;
  paddingTop: number;
  onLocation: () => void;
  onRedeem: () => void;
  onAccount: () => void;
}

/** Domino's-style top bar: Location (left) · Redeem Free Items (pill) · Account. */
export function HomeHeader({ location, initial, avatarUri, paddingTop, onLocation, onRedeem, onAccount }: Readonly<HomeHeaderProps>) {
  const brand = useColors();
  let account = <MIcon name="account-outline" size={20} color={brand.gold} />;
  if (avatarUri) {
    account = <Image source={avatarUri} style={{ width: 40, height: 40 }} contentFit="cover" />;
  } else if (initial) {
    account = <Text fontSize={16} fontWeight="800" color={brand.gold}>{initial}</Text>;
  }
  return (
    <YStack paddingTop={paddingTop} paddingHorizontal={16} paddingBottom={12} backgroundColor={brand.bg}>
      <FadeInView>
        <XStack alignItems="center" gap={10}>
          <YStack flex={1} pressStyle={{ opacity: 0.7 }} onPress={onLocation}>
            <Text fontSize={11} color={brand.muted} textTransform="uppercase" letterSpacing={0.6}>
              Deliver to
            </Text>
            <XStack alignItems="center" gap={4}>
              <MIcon name="map-marker" size={16} color={brand.gold} />
              <Text fontSize={15} fontWeight="800" color={brand.text} numberOfLines={1} maxWidth={170}>
                {location}
              </Text>
              <MIcon name="chevron-down" size={18} color={brand.dim} />
            </XStack>
          </YStack>

          <XStack
            alignItems="center"
            gap={6}
            height={38}
            paddingHorizontal={12}
            borderRadius={999}
            backgroundColor="rgba(228,182,92,0.14)"
            borderColor={brand.goldDeep}
            borderWidth={1}
            pressStyle={{ opacity: 0.8 }}
            onPress={onRedeem}
          >
            <MIcon name="gift-outline" size={16} color={brand.gold} />
            <Text fontSize={12} fontWeight="800" color={brand.gold}>Redeem</Text>
          </XStack>

          <YStack
            width={40}
            height={40}
            borderRadius={999}
            backgroundColor={brand.maroonSoft}
            borderColor={brand.gold}
            borderWidth={1}
            alignItems="center"
            justifyContent="center"
            overflow="hidden"
            pressStyle={{ opacity: 0.8 }}
            onPress={onAccount}
          >
            {account}
          </YStack>
        </XStack>
      </FadeInView>
    </YStack>
  );
}
