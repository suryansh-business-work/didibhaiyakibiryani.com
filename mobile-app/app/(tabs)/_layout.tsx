import { Tabs } from "expo-router";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { brand } from "../../src/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: brand.gold,
        tabBarInactiveTintColor: brand.muted,
        tabBarStyle: {
          backgroundColor: "#0c0805",
          borderTopColor: brand.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
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
