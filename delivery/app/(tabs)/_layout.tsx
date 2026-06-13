import { Redirect, Tabs } from "expo-router";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import { useAuth } from "../../src/auth";
import { Loading } from "../../src/ui";
import { brand } from "../../src/theme";

export default function TabsLayout() {
  const { user, loading } = useAuth();

  if (loading) return <Loading label="Loading…" />;
  if (!user) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: brand.card, borderTopColor: brand.border },
        tabBarActiveTintColor: brand.gold,
        tabBarInactiveTintColor: brand.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
        sceneStyle: { backgroundColor: brand.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Queue",
          tabBarIcon: ({ color, size }) => <MaterialDesignIcons name="moped" color={color} size={size ?? 24} />,
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: "Earnings",
          tabBarIcon: ({ color, size }) => <MaterialDesignIcons name="wallet-outline" color={color} size={size ?? 24} />,
        }}
      />
      <Tabs.Screen
        name="support"
        options={{
          title: "Support",
          tabBarIcon: ({ color, size }) => <MaterialDesignIcons name="headset" color={color} size={size ?? 24} />,
        }}
      />
    </Tabs>
  );
}
