import type { ComponentProps } from "react";
import { Image } from "expo-image";
import { Text, XStack, YStack, Button } from "tamagui";
import Svg, { Ellipse, Circle, Path, G, Defs, RadialGradient, Stop } from "react-native-svg";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { brand } from "./theme";
import { useSettings } from "./settings";

export type IconName = ComponentProps<typeof MaterialDesignIcons>["name"];

/** Thin wrapper around Material Design Icons so every screen uses the same set. */
export function MIcon({
  name,
  size = 20,
  color = brand.text,
}: Readonly<{ name: IconName; size?: number; color?: string }>) {
  return <MaterialDesignIcons name={name} size={size} color={color} />;
}

/** Circular back button used in screen headers. */
export function BackButton({ onPress }: Readonly<{ onPress: () => void }>) {
  return (
    <Button
      size="$3"
      circular
      backgroundColor={brand.card}
      borderColor={brand.border}
      borderWidth={1}
      onPress={onPress}
    >
      <MIcon name="chevron-left" size={24} color={brand.text} />
    </Button>
  );
}

/** Brand logo from admin settings; falls back to the maroon badge when the
 * admin hasn't uploaded a logo yet. Used on the login / sign-up screens. */
export function BrandLogo({ size = 64 }: Readonly<{ size?: number }>) {
  const { logoUrl } = useSettings();
  if (logoUrl) {
    return (
      <Image
        source={logoUrl}
        style={{ width: size, height: size, borderRadius: 999, backgroundColor: brand.maroonSoft }}
        contentFit="cover"
        transition={150}
      />
    );
  }
  return (
    <YStack width={size} height={size} borderRadius={999} backgroundColor={brand.maroonSoft} borderColor={brand.gold} borderWidth={2} />
  );
}

/**
 * Request a right-sized, auto-format ImageKit thumbnail (2× for retina) instead
 * of the full-resolution original — small files load fast on mobile data.
 */
function thumbUrl(uri: string, size: number): string {
  if (!uri.includes("imagekit.io")) return uri;
  const px = Math.round(size * 2);
  const sep = uri.includes("?") ? "&" : "?";
  return `${uri}${sep}tr=w-${px},h-${px},fo-auto`;
}

/**
 * Food thumbnail. Shows the item's real photo when `uri` is set, otherwise
 * falls back to the stylised biryani-bowl illustration. Uses expo-image for
 * reliable remote loading + caching on both native and the web export.
 */
export function FoodThumb({
  size = 96,
  hue = 16,
  uri,
}: Readonly<{ size?: number; hue?: number; uri?: string }>) {
  if (uri) {
    return (
      <Image
        source={thumbUrl(uri, size)}
        style={{ width: size, height: size, borderRadius: 14, backgroundColor: brand.cardSoft }}
        contentFit="cover"
        transition={150}
      />
    );
  }
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

const SPICE_ICON = ["chili-mild", "chili-medium", "chili-hot"] as const;

/** Ordered spice levels (index = stored spiceLevel) shared across screens. */
export const SPICE_LABELS = ["Mild", "Medium", "Spicy", "Fiery"] as const;

export function Spice({ level }: Readonly<{ level: number }>) {
  if (level <= 0) return <Text fontSize={12} color={brand.muted}>Mild</Text>;
  return (
    <XStack gap={2} alignItems="center">
      {Array.from({ length: level }, (_, i) => (
        <MIcon key={i} name={SPICE_ICON[Math.min(level, 3) - 1]} size={14} color={brand.red} />
      ))}
    </XStack>
  );
}

/** Chip row to pick a spice level. Reused on the item page and in the cart so
 * the customer can set spice at order time. `value` is the current level. */
export function SpicePicker({
  value,
  onChange,
  size = "$2.5",
}: Readonly<{
  value: number;
  onChange: (level: number) => void;
  size?: ComponentProps<typeof Button>["size"];
}>) {
  return (
    <XStack gap={8} flexWrap="wrap">
      {SPICE_LABELS.map((label, level) => {
        const active = value === level;
        return (
          <Button
            key={label}
            size={size}
            borderRadius={999}
            backgroundColor={active ? "rgba(228,182,92,0.16)" : "rgba(255,255,255,0.04)"}
            borderColor={active ? brand.goldDeep : brand.border}
            borderWidth={1}
            color={active ? brand.gold : brand.dim}
            fontWeight="700"
            onPress={() => onChange(level)}
          >
            {"🌶️".repeat(level) || "○"} {label}
          </Button>
        );
      })}
    </XStack>
  );
}

export function Stars({ rating }: Readonly<{ rating: number }>) {
  return (
    <XStack gap={3} alignItems="center">
      <MIcon name="star" size={13} color={brand.gold} />
      <Text fontSize={12} color={brand.dim}>{rating.toFixed(1)}</Text>
    </XStack>
  );
}
