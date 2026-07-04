import "react-native-gesture-handler";
import { View } from "react-native";
import { TamaguiProvider } from "tamagui";
import { ApolloProvider } from "@apollo/client";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import tamaguiConfig from "../tamagui.config";
import { client } from "../src/apollo";
import { AuthProvider } from "../src/auth";
import { CartProvider } from "../src/cart";
import { FulfilmentProvider } from "../src/fulfilment";
import { SettingsProvider } from "../src/settings";
import { MaintenanceGate } from "../src/MaintenanceGate";
import { ActiveOrderBar } from "../src/order/ActiveOrderBar";
import { BrandFont } from "../src/BrandFont";
import { ThemeProvider, useThemeMode } from "../src/theme";

/** Phone-frame width: on wide screens (web/tablet) the app is capped to a
 * mobile width and centred; on phones (< 767px) it fills the screen as usual. */
const FRAME_MAX_WIDTH = 767;

/** Everything below the ThemeProvider — reads the active scheme so Tamagui,
 *  the status bar and the page background all flip together for light/dark. */
function ThemedShell() {
  const { scheme, colors } = useThemeMode();
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1, width: "100%", maxWidth: FRAME_MAX_WIDTH, alignSelf: "center", backgroundColor: colors.bg }}>
        <TamaguiProvider config={tamaguiConfig} defaultTheme={scheme}>
          <ApolloProvider client={client}>
            <SettingsProvider>
              <AuthProvider>
                <CartProvider>
                  <FulfilmentProvider>
                    <SafeAreaProvider>
                      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
                      <BrandFont />
                      <MaintenanceGate>
                        <Stack
                          screenOptions={{
                            headerShown: false,
                            contentStyle: { backgroundColor: colors.bg },
                            animation: "none",
                          }}
                        />
                        <ActiveOrderBar />
                      </MaintenanceGate>
                    </SafeAreaProvider>
                  </FulfilmentProvider>
                </CartProvider>
              </AuthProvider>
            </SettingsProvider>
          </ApolloProvider>
        </TamaguiProvider>
      </View>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ThemedShell />
    </ThemeProvider>
  );
}
