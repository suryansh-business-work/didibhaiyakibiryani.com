import type { ReactNode } from "react";
import { YStack, Text } from "tamagui";
import { useSettings } from "./settings";
import { FadeInView } from "./animations";
import { brand } from "./theme";

/** Full-screen takeover while the admin has the customer app in maintenance. */
export function MaintenanceGate({ children }: Readonly<{ children: ReactNode }>) {
  const settings = useSettings();

  if (!settings.maintenance.native) {
    return <>{children}</>;
  }

  return (
    <YStack
      flex={1}
      backgroundColor={brand.bg}
      alignItems="center"
      justifyContent="center"
      padding={32}
      gap={14}
    >
      <FadeInView>
        <YStack alignItems="center" gap={12}>
          <Text fontSize={52}>🛠️</Text>
          <Text fontSize={22} fontWeight="800" color={brand.text} textAlign="center">
            Back in a bit!
          </Text>
          <Text color={brand.muted} textAlign="center" fontSize={14}>
            {settings.brandName} is down for a quick maintenance break. The dum needs a
            moment — please check back soon.
          </Text>
          {settings.supportPhone ? (
            <Text color={brand.gold} fontSize={13}>
              Need help? Call {settings.supportPhone}
            </Text>
          ) : null}
        </YStack>
      </FadeInView>
    </YStack>
  );
}
