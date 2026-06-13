import type { ReactNode } from "react";
import { useQuery } from "@apollo/client";
import { YStack, Text } from "tamagui";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { SETTINGS_LITE } from "./graphql";
import { brand } from "./theme";

interface SettingsData {
  settings?: { brandName?: string; supportPhone?: string; maintenance?: { delivery?: boolean } };
}

/** Full-screen takeover while the admin has the delivery app in maintenance. */
export function MaintenanceGate({ children }: Readonly<{ children: ReactNode }>) {
  const { data } = useQuery<SettingsData>(SETTINGS_LITE, { pollInterval: 60000 });
  const s = data?.settings;

  if (!s?.maintenance?.delivery) {
    return <>{children}</>;
  }

  return (
    <YStack flex={1} backgroundColor={brand.bg} alignItems="center" justifyContent="center" padding={32} gap={12}>
      <MaterialDesignIcons name="wrench-outline" size={52} color={brand.gold} />
      <Text fontSize={22} fontWeight="800" color={brand.text} textAlign="center">Back soon</Text>
      <Text color={brand.muted} textAlign="center" fontSize={14}>
        The {s.brandName || "delivery"} portal is down for a quick maintenance break — please check back shortly.
      </Text>
      {s.supportPhone ? <Text color={brand.gold} fontSize={13}>Need help? Call {s.supportPhone}</Text> : null}
    </YStack>
  );
}
