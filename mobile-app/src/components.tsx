import type { ComponentProps } from "react";
import { Image } from "expo-image";
import { Text, XStack, YStack, Button } from "tamagui";
import Svg, { Ellipse, Circle, Path, G, Defs, RadialGradient, Stop } from "react-native-svg";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { useColors } from "./theme";
import { useSettings } from "./settings";

export type IconName = ComponentProps<typeof MaterialDesignIcons>["name"];

/** Thin wrapper around Material Design Icons so every screen uses the same set.
 *  Defaults to the theme's text colour when no colour is given. */
export function MIcon({
  name,
  size = 20,
  color,
}: Readonly<{ name: IconName; size?: number; color?: string }>) {
  const c = useColors();
  return <MaterialDesignIcons name={name} size={size} color={color ?? c.text} />;
}

/** Circular back button used in screen headers. */
export function BackButton({ onPress }: Readonly<{ onPress: () => void }>) {
  const c = useColors();
  return (
    <Button size="$3" circular backgroundColor={c.card} borderColor={c.border} borderWidth={1} onPress={onPress}>
      <MIcon name="chevron-left" size={24} color={c.text} />
    </Button>
  );
}

/** Brand logo from admin settings; falls back to the maroon badge when the
 * admin hasn't uploaded a logo yet. Used on the login / sign-up screens. */
export function BrandLogo({ size = 64 }: Readonly<{ size?: number }>) {
  const c = useColors();
  const { logoUrl } = useSettings();
  if (logoUrl) {
    return (
      <Image
        source={logoUrl}
        style={{ width: size, height: size, borderRadius: 999, backgroundColor: c.maroonSoft }}
        contentFit="cover"
        transition={150}
      />
    );
  }
  return <YStack width={size} height={size} borderRadius={999} backgroundColor={c.maroonSoft} borderColor={c.gold} borderWidth={2} />;
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
 * falls back to the stylised biryani-bowl illustration.
 */
export function FoodThumb({
  size = 96,
  hue = 16,
  uri,
}: Readonly<{ size?: number; hue?: number; uri?: string }>) {
  const c = useColors();
  if (uri) {
    return (
      <Image
        source={thumbUrl(uri, size)}
        style={{ width: size, height: size, borderRadius: 14, backgroundColor: c.cardSoft }}
        contentFit="cover"
        transition={150}
      />
    );
  }
  return (
    <YStack width={size} height={size} borderRadius={14} overflow="hidden" backgroundColor={c.cardSoft} alignItems="center" justifyContent="center">
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
        <Circle cx="52" cy="54" r="2" fill={c.gold} />
        <Circle cx="68" cy="52" r="2" fill={c.green} />
        <Circle cx="60" cy="58" r="2" fill={c.gold} />
        <Path d="M50 36c-6-8 6-12 0-20" stroke="rgba(255,240,220,0.3)" strokeWidth={2.5} strokeLinecap="round" fill="none" />
        <Path d="M70 34c-6-8 6-12 0-20" stroke="rgba(255,240,220,0.3)" strokeWidth={2.5} strokeLinecap="round" fill="none" />
      </Svg>
    </YStack>
  );
}

export function Badge({ label, color, bg }: Readonly<{ label: string; color?: string; bg?: string }>) {
  const c = useColors();
  return (
    <XStack paddingHorizontal={9} paddingVertical={3} borderRadius={999} backgroundColor={bg ?? "rgba(228,182,92,0.15)"} alignSelf="flex-start">
      <Text fontSize={10} fontWeight="800" color={color ?? c.gold} textTransform="uppercase" letterSpacing={0.5}>
        {label}
      </Text>
    </XStack>
  );
}

/** Branded full-area error with an optional retry — shown when a server query
 *  fails so the customer sees a friendly message instead of a blank screen. */
export function ErrorState({
  message,
  onRetry,
  retryLabel = "Try again",
}: Readonly<{ message: string; onRetry?: () => void; retryLabel?: string }>) {
  const c = useColors();
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" padding={28} gap={14}>
      <YStack width={64} height={64} borderRadius={999} backgroundColor={c.maroonSoft} alignItems="center" justifyContent="center">
        <MIcon name="alert-circle-outline" size={30} color={c.red} />
      </YStack>
      <Text fontSize={18} fontWeight="800" color={c.text} textAlign="center">Something went wrong</Text>
      <Text color={c.muted} textAlign="center">{message}</Text>
      {onRetry ? (
        <Button backgroundColor={c.gold} color={c.onGold} fontWeight="800" icon={<MIcon name="refresh" size={16} color={c.onGold} />} onPress={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </YStack>
  );
}

/** The standard veg / non-veg square mark (green = veg, red = non-veg). */
export function VegMark({ veg, size = 14 }: Readonly<{ veg: boolean; size?: number }>) {
  const c = useColors();
  const color = veg ? c.green : c.red;
  return (
    <YStack width={size} height={size} borderWidth={1.5} borderColor={color} borderRadius={3} alignItems="center" justifyContent="center">
      <YStack width={size * 0.42} height={size * 0.42} borderRadius={999} backgroundColor={color} />
    </YStack>
  );
}

const SPICE_ICON = ["chili-mild", "chili-medium", "chili-hot"] as const;

/** Ordered spice levels (index = stored spiceLevel) shared across screens. */
export const SPICE_LABELS = ["Mild", "Medium", "Spicy", "Fiery"] as const;

export function Spice({ level }: Readonly<{ level: number }>) {
  const c = useColors();
  if (level <= 0) return <Text fontSize={12} color={c.muted}>Mild</Text>;
  return (
    <XStack gap={2} alignItems="center">
      {Array.from({ length: level }, (_, i) => (
        <MIcon key={i} name={SPICE_ICON[Math.min(level, 3) - 1]} size={14} color={c.red} />
      ))}
    </XStack>
  );
}

/** Chip row to pick a spice level. Reused on the item page and in the cart. */
export function SpicePicker({
  value,
  onChange,
  size = "$2.5",
}: Readonly<{ value: number; onChange: (level: number) => void; size?: ComponentProps<typeof Button>["size"] }>) {
  const c = useColors();
  return (
    <XStack gap={8} flexWrap="wrap">
      {SPICE_LABELS.map((label, level) => {
        const active = value === level;
        return (
          <Button
            key={label}
            size={size}
            borderRadius={999}
            backgroundColor={active ? "rgba(228,182,92,0.16)" : c.cardSoft}
            borderColor={active ? c.goldDeep : c.border}
            borderWidth={1}
            color={active ? c.gold : c.dim}
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
  const c = useColors();
  return (
    <XStack gap={3} alignItems="center">
      <MIcon name="star" size={13} color={c.gold} />
      <Text fontSize={12} color={c.dim}>{rating.toFixed(1)}</Text>
    </XStack>
  );
}
