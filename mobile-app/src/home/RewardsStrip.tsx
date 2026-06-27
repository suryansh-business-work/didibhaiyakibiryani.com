import { useQuery } from "@apollo/client";
import { useRouter } from "expo-router";
import { XStack, YStack, Text } from "tamagui";
import { MY_REWARDS } from "../graphql";
import { useAuth } from "../auth";
import { useColors } from "../theme";
import { MIcon } from "../components";

interface Rewards { enabled: boolean; points: number; rewardsAvailable: number }

/** Home "Cheesy Rewards" strip — shows points / a ready reward, links to the
 *  full Rewards screen. Hidden when logged out or loyalty is off. */
export function RewardsStrip() {
  const brand = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const { data } = useQuery<{ myRewards: Rewards }>(MY_REWARDS, { skip: !user });
  const r = data?.myRewards;
  if (!user || !r?.enabled) return null;
  const ready = r.rewardsAvailable > 0;

  return (
    <YStack paddingHorizontal={16} paddingTop={18}>
      <XStack
        onPress={() => router.push("/rewards")}
        pressStyle={{ opacity: 0.9 }}
        backgroundColor={brand.card}
        borderColor={brand.gold}
        borderWidth={1}
        borderRadius={16}
        padding={14}
        alignItems="center"
        gap={12}
      >
        <YStack width={40} height={40} borderRadius={999} backgroundColor={brand.maroonSoft} alignItems="center" justifyContent="center">
          <MIcon name="gift-outline" size={20} color={brand.gold} />
        </YStack>
        <YStack flex={1}>
          <Text fontWeight="800" color={brand.text}>Cheesy Rewards</Text>
          <Text fontSize={12} color={brand.muted}>{ready ? "A free item is ready to redeem!" : `${r.points} points earned`}</Text>
        </YStack>
        <MIcon name="chevron-right" size={20} color={brand.gold} />
      </XStack>
    </YStack>
  );
}
