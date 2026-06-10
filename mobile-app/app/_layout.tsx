import "react-native-gesture-handler";
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
import { SettingsProvider } from "../src/settings";
import { MaintenanceGate } from "../src/MaintenanceGate";
import { brand } from "../src/theme";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
        <ApolloProvider client={client}>
          <SettingsProvider>
            <AuthProvider>
              <CartProvider>
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
                  </MaintenanceGate>
                </SafeAreaProvider>
              </CartProvider>
            </AuthProvider>
          </SettingsProvider>
        </ApolloProvider>
      </TamaguiProvider>
    </GestureHandlerRootView>
  );
}
