import { useState } from "react";
import { ScrollView, Alert } from "react-native";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { YStack, XStack, Text, Button, Spinner } from "tamagui";
import { MY_REWARDS, REDEEM_REWARD } from "../src/graphql";
import { useAuth } from "../src/auth";
import { useColors } from "../src/theme";
import { errorMessage } from "../src/error";
import { BackButton, ErrorState, FoodThumb, MIcon } from "../src/components";

interface Rewards {
  enabled: boolean;
  points: number;
  pointsPerOrder: number;
  pointsMinOrder: number;
  pointsPerReward: number;
  rewardsAvailable: number;
  rewardName?: string;
  rewardItem?: { id: string; name: string; image?: string } | null;
}

function HowItWorks({ r }: Readonly<{ r: Rewards }>) {
  const brand = useColors();
  const itemName = r.rewardName || r.rewardItem?.name || "a free item";
  return (
    <YStack backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} borderRadius={16} padding={18} gap={14}>
      <Text fontWeight="800" color={brand.text} fontSize={16}>How it works</Text>
      <XStack gap={12} alignItems="center">
        <MIcon name="silverware-fork-knife" size={22} color={brand.gold} />
        <Text flex={1} color={brand.dim}>1 order of ₹{r.pointsMinOrder} or more = <Text fontWeight="800" color={brand.text}>{r.pointsPerOrder} points</Text>, credited after delivery.</Text>
      </XStack>
      <XStack gap={12} alignItems="center">
        <MIcon name="gift-outline" size={22} color={brand.gold} />
        <Text flex={1} color={brand.dim}><Text fontWeight="800" color={brand.text}>{r.pointsPerReward} points</Text> = {itemName} free.</Text>
      </XStack>
    </YStack>
  );
}

export default function RewardsScreen() {
  const brand = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { data, loading, error, refetch } = useQuery<{ myRewards: Rewards }>(MY_REWARDS, { skip: !user });
  const [redeem, { loading: redeeming }] = useMutation(REDEEM_REWARD);
  const [code, setCode] = useState<string | null>(null);

  if (!authLoading && !user) {
    return (
      <YStack flex={1} backgroundColor={brand.bg} alignItems="center" justifyContent="center" padding={28} gap={14}>
        <Text fontSize={40}>🎁</Text>
        <Text fontSize={20} fontWeight="800" color={brand.text} textAlign="center">Earn rewards on every order</Text>
        <Button backgroundColor={brand.gold} color="#2a1a06" fontWeight="800" onPress={() => router.push("/login")}>Log in</Button>
      </YStack>
    );
  }

  const r = data?.myRewards;

  async function onRedeem() {
    try {
      const res = await redeem();
      setCode(res.data?.redeemReward?.code ?? null);
      await refetch();
    } catch (e: unknown) {
      Alert.alert("Could not redeem", errorMessage(e, "Please try again later."));
    }
  }

  const per = r && r.pointsPerReward > 0 ? r.pointsPerReward : 1;
  const within = r ? r.points % per : 0;
  const pct = Math.round((within / per) * 100);
  const toNext = per - within;
  const canRedeem = Boolean(r && r.rewardsAvailable > 0);

  return (
    <YStack flex={1} backgroundColor={brand.bg}>
      <XStack paddingTop={insets.top + 8} paddingHorizontal={16} paddingBottom={10} alignItems="center" gap={12}>
        <BackButton onPress={() => router.back()} />
        <Text fontSize={22} fontWeight="800" color={brand.text}>Cheesy Rewards</Text>
      </XStack>

      {loading && !data ? (
        <YStack flex={1} alignItems="center" justifyContent="center"><Spinner color={brand.gold} /></YStack>
      ) : error && !data ? (
        <ErrorState message={errorMessage(error)} onRetry={() => { refetch().catch(() => {}); }} />
      ) : !r?.enabled ? (
        <YStack flex={1} alignItems="center" justifyContent="center" padding={28} gap={12}>
          <Text fontSize={40}>🎁</Text>
          <Text color={brand.muted} textAlign="center">Rewards are coming soon. Keep ordering!</Text>
        </YStack>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 30 }}>
          <YStack backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} borderRadius={16} padding={18} gap={12}>
            <Text color={brand.muted} fontWeight="700">Your points</Text>
            <XStack alignItems="flex-end" gap={8}>
              <Text fontSize={40} fontWeight="900" color={brand.gold}>{r.points}</Text>
              <Text fontSize={16} color={brand.muted} marginBottom={8}>points</Text>
            </XStack>
            <YStack height={8} borderRadius={999} backgroundColor={brand.cardSoft} overflow="hidden">
              <YStack height={8} width={`${pct}%`} backgroundColor={brand.gold} borderRadius={999} />
            </YStack>
            <Text fontSize={13} color={brand.muted}>{canRedeem ? "A reward is ready to redeem!" : `${toNext} more points to your next reward`}</Text>
          </YStack>

          <YStack backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} borderRadius={16} padding={18} gap={12}>
            <XStack gap={14} alignItems="center">
              <FoodThumb size={64} uri={r.rewardItem?.image ?? undefined} />
              <YStack flex={1}>
                <Text fontWeight="800" color={brand.text} fontSize={16}>{r.rewardName || r.rewardItem?.name || "Free item"}</Text>
                <Text fontSize={13} color={brand.muted}>{canRedeem ? `${r.rewardsAvailable} reward${r.rewardsAvailable > 1 ? "s" : ""} available` : `Redeem at ${r.pointsPerReward} points`}</Text>
              </YStack>
            </XStack>
            <Button
              height={46}
              backgroundColor={canRedeem ? brand.gold : brand.cardSoft}
              color={canRedeem ? "#2a1a06" : brand.muted}
              fontWeight="800"
              borderRadius={12}
              disabled={!canRedeem || redeeming}
              onPress={onRedeem}
            >
              {redeeming ? "Redeeming…" : "Redeem free item"}
            </Button>
          </YStack>

          {code && (
            <YStack backgroundColor={brand.maroonSoft} borderColor={brand.gold} borderWidth={1} borderRadius={16} padding={18} gap={6}>
              <Text fontWeight="800" color={brand.text}>🎉 Reward unlocked!</Text>
              <Text color={brand.dim}>Use this code at checkout:</Text>
              <Text fontSize={22} fontWeight="900" color={brand.gold} letterSpacing={1}>{code}</Text>
            </YStack>
          )}

          <HowItWorks r={r} />
        </ScrollView>
      )}
    </YStack>
  );
}
