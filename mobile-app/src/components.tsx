import { Text, XStack, YStack } from "tamagui";
import Svg, { Ellipse, Circle, Path, G, Defs, RadialGradient, Stop } from "react-native-svg";
import { brand } from "./theme";

/** A stylised biryani-bowl thumbnail used in place of food photography. */
export function FoodThumb({ size = 96, hue = 16 }: Readonly<{ size?: number; hue?: number }>) {
  return (
    <YStack
      width={size}
      height={size}
      borderRadius={14}
      overflow="hidden"
      backgroundColor={brand.cardSoft}
      alignItems="center"
      justifyContent="center"
    >
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Defs>
          <RadialGradient id={`bowl-${hue}`} cx="50%" cy="38%" r="65%">
            <Stop offset="0%" stopColor="#7a2a1c" />
            <Stop offset="100%" stopColor="#3a0f0c" />
          </RadialGradient>
        </Defs>
        <Ellipse cx="60" cy="78" rx="42" ry="14" fill="rgba(0,0,0,0.35)" />
        <Ellipse cx="60" cy="64" rx="42" ry="18" fill="#1c100b" />
        <Ellipse cx="60" cy="58" rx="36" ry="15" fill={`url(#bowl-${hue})`} />
        <G fill="#f0e3c8">
          <Ellipse cx="48" cy="53" rx="3.4" ry="1.5" />
          <Ellipse cx="60" cy="50" rx="3.4" ry="1.5" />
          <Ellipse cx="72" cy="54" rx="3.4" ry="1.5" />
          <Ellipse cx="54" cy="58" rx="3.4" ry="1.5" />
          <Ellipse cx="66" cy="59" rx="3.4" ry="1.5" />
        </G>
        <Circle cx="52" cy="54" r="2" fill={brand.gold} />
        <Circle cx="68" cy="52" r="2" fill={brand.green} />
        <Circle cx="60" cy="58" r="2" fill={brand.gold} />
        {/* steam */}
        <Path d="M50 36c-6-8 6-12 0-20" stroke="rgba(255,240,220,0.3)" strokeWidth={2.5} strokeLinecap="round" fill="none" />
        <Path d="M70 34c-6-8 6-12 0-20" stroke="rgba(255,240,220,0.3)" strokeWidth={2.5} strokeLinecap="round" fill="none" />
      </Svg>
    </YStack>
  );
}

export function Badge({
  label,
  color = brand.gold,
  bg,
}: Readonly<{
  label: string;
  color?: string;
  bg?: string;
}>) {
  return (
    <XStack
      paddingHorizontal={9}
      paddingVertical={3}
      borderRadius={999}
      backgroundColor={bg ?? "rgba(228,182,92,0.15)"}
      alignSelf="flex-start"
    >
      <Text fontSize={10} fontWeight="800" color={color} textTransform="uppercase" letterSpacing={0.5}>
        {label}
      </Text>
    </XStack>
  );
}

export function Spice({ level }: Readonly<{ level: number }>) {
  if (level <= 0) return <Text fontSize={12} color={brand.muted}>Mild</Text>;
  return <Text fontSize={12}>{"🌶️".repeat(level)}</Text>;
}

export function Stars({ rating }: Readonly<{ rating: number }>) {
  return (
    <Text fontSize={12} color={brand.gold}>
      ★ <Text color={brand.dim}>{rating.toFixed(1)}</Text>
    </Text>
  );
}
