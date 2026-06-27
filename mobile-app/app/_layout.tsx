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
import { brand } from "../src/theme";

/** Phone-frame width: on wide screens (web/tablet) the app is capped to a
 * mobile width and centred; on phones (< 767px) it fills the screen as usual. */
const FRAME_MAX_WIDTH = 767;

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: brand.bg }}>
      <View style={{ flex: 1, width: "100%", maxWidth: FRAME_MAX_WIDTH, alignSelf: "center", backgroundColor: brand.bg }}>
        <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
          <ApolloProvider client={client}>
            <SettingsProvider>
              <AuthProvider>
                <CartProvider>
                  <FulfilmentProvider>
                  <SafeAreaProvider>
                    <StatusBar style="light" />
                    <MaintenanceGate>
                      <Stack
                        screenOptions={{
                          headerShown: false,
                          contentStyle: { backgroundColor: brand.bg },
                          animation: "slide_from_right",
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
