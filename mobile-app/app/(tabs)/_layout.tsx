import { Tabs } from "expo-router";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { brand } from "../../src/theme";

function Icon({ name, color }: { name: string; color: string }) {
  const p = {
    stroke: color,
    strokeWidth: 1.9,
    fill: "none" as const,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <Svg width={23} height={23} viewBox="0 0 24 24">
      {name === "home" && (
        <>
          <Path d="M4 10h16v4a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6Z" {...p} />
          <Path d="M2 10h20M8 10V7M16 10V7" {...p} />
        </>
      )}
      {name === "offers" && (
        <>
          <Path d="M3 12V4h8l9 9-8 8-9-9Z" {...p} />
          <Circle cx="7.5" cy="7.5" r="1.4" {...p} />
        </>
      )}
      {name === "orders" && (
        <>
          <Path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" {...p} />
          <Path d="M3 6h18M16 10a4 4 0 0 1-8 0" {...p} />
        </>
      )}
      {name === "profile" && (
        <>
          <Circle cx="12" cy="8" r="4" {...p} />
          <Path d="M4 21a8 8 0 0 1 16 0" {...p} />
        </>
      )}
      {name === "cart" && (
        <>
          <Circle cx="9" cy="20" r="1.6" {...p} />
          <Circle cx="18" cy="20" r="1.6" {...p} />
          <Path d="M2 3h3l2.4 12.4a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L23 7H6" {...p} />
        </>
      )}
      {name === "dummy" && <Rect x="0" y="0" width="0" height="0" />}
    </Svg>
  );
}

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
        options={{ title: "Home", tabBarIcon: ({ color }) => <Icon name="home" color={color} /> }}
      />
      <Tabs.Screen
        name="offers"
        options={{ title: "Offers", tabBarIcon: ({ color }) => <Icon name="offers" color={color} /> }}
      />
      <Tabs.Screen
        name="orders"
        options={{ title: "Orders", tabBarIcon: ({ color }) => <Icon name="orders" color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Profile", tabBarIcon: ({ color }) => <Icon name="profile" color={color} /> }}
      />
    </Tabs>
  );
}
