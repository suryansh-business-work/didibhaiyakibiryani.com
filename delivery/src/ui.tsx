import type { ReactNode } from "react";
import { useQuery } from "@apollo/client";
import { YStack, XStack, Text, Button, Image, Spinner as TamaguiSpinner } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { useAuth } from "./auth";
import { SETTINGS_LITE } from "./graphql";
import { brand, STATUS_META } from "./theme";

/** Brand logo from admin settings; falls back to the maroon badge until a
 * logo is uploaded. Self-fetching so it works on the pre-login screen. */
export function BrandLogo({ size = 64 }: Readonly<{ size?: number }>) {
  const { data } = useQuery<{ settings?: { logoUrl?: string } }>(SETTINGS_LITE);
  const logoUrl = data?.settings?.logoUrl;
  if (logoUrl) {
    return <Image source={{ uri: logoUrl, width: size, height: size }} width={size} height={size} borderRadius={999} backgroundColor={brand.maroonSoft} />;
  }
  return <YStack width={size} height={size} borderRadius={999} backgroundColor={brand.maroonSoft} borderColor={brand.gold} borderWidth={2} />;
}

export function RiderHeader({ title }: Readonly<{ title: string }>) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  return (
    <YStack
      paddingTop={insets.top + 10}
      paddingHorizontal={18}
      paddingBottom={10}
      backgroundColor={brand.bg}
      borderBottomColor={brand.border}
      borderBottomWidth={1}
    >
      <XStack justifyContent="space-between" alignItems="flex-end">
        <YStack>
          <Text fontSize={12} color={brand.gold} fontWeight="700">Didi Bhaiya · Delivery</Text>
          <Text fontSize={24} fontWeight="800" color={brand.text}>{title}</Text>
        </YStack>
        <XStack alignItems="center" gap={10}>
          <Text color={brand.muted} fontSize={12} numberOfLines={1}>{user?.name}</Text>
          <Button size="$2" backgroundColor={brand.card} borderColor={brand.border} borderWidth={1} color={brand.dim} onPress={logout}>
            Sign out
          </Button>
        </XStack>
      </XStack>
    </YStack>
  );
}

export function Loading({ label }: Readonly<{ label?: string }>) {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" padding={28} gap={12}>
      <TamaguiSpinner color={brand.gold} size="large" />
      {label ? <Text color={brand.muted}>{label}</Text> : null}
    </YStack>
  );
}

export function Empty({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <YStack alignItems="center" justifyContent="center" padding={28} gap={10}>
      <MaterialDesignIcons name="moped-outline" size={44} color={brand.muted} />
      <Text color={brand.muted} textAlign="center">{children}</Text>
    </YStack>
  );
}

export function StatusBadge({ status }: Readonly<{ status: string }>) {
  const meta = STATUS_META[status] ?? { label: status, color: brand.muted };
  return (
    <XStack alignItems="center" gap={6}>
      <YStack width={8} height={8} borderRadius={999} backgroundColor={meta.color} />
      <Text fontSize={12} fontWeight="700" color={meta.color}>{meta.label}</Text>
    </XStack>
  );
}
