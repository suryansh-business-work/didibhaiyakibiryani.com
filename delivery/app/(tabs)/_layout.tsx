import { Redirect, Tabs } from "expo-router";
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
        sceneStyle: { backgroundColor: brand.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Queue", tabBarLabel: "🛵 Queue" }} />
      <Tabs.Screen name="earnings" options={{ title: "Earnings", tabBarLabel: "💰 Earnings" }} />
      <Tabs.Screen name="support" options={{ title: "Support", tabBarLabel: "🎧 Support" }} />
    </Tabs>
  );
}
