import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { useColors } from "../../src/theme";

export default function TabsLayout() {
  const brand = useColors();
  // Add the device's bottom safe-area inset (home indicator / gesture bar) so
  // the tab labels aren't clipped at the screen edge.
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: brand.gold,
        tabBarInactiveTintColor: brand.muted,
        tabBarStyle: {
          backgroundColor: brand.card,
          borderTopColor: brand.border,
          height: 68 + insets.bottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
        tabBarIconStyle: { marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <MaterialDesignIcons name="home-variant" color={color} size={size ?? 24} />,
        }}
      />
      <Tabs.Screen
        name="offers"
        options={{
          title: "Offers",
          tabBarIcon: ({ color, size }) => <MaterialDesignIcons name="tag-heart-outline" color={color} size={size ?? 24} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, size }) => <MaterialDesignIcons name="receipt-text-outline" color={color} size={size ?? 24} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <MaterialDesignIcons name="account-outline" color={color} size={size ?? 24} />,
        }}
      />
    </Tabs>
  );
}
