import { XStack, Text } from "tamagui";
import { useColors, useThemeMode, type ThemeMode } from "./theme";
import { MIcon, type IconName } from "./components";

const OPTIONS: ReadonlyArray<{ mode: ThemeMode; label: string; icon: IconName }> = [
  { mode: "system", label: "System", icon: "theme-light-dark" },
  { mode: "light", label: "Light", icon: "white-balance-sunny" },
  { mode: "dark", label: "Dark", icon: "moon-waning-crescent" },
];

/** Segmented System / Light / Dark control. Persists via the theme provider. */
export function ThemeToggle() {
  const c = useColors();
  const { mode, setMode } = useThemeMode();
  return (
    <XStack backgroundColor={c.cardSoft} borderRadius={999} padding={4} gap={4}>
      {OPTIONS.map((o) => {
        const active = mode === o.mode;
        return (
          <XStack
            key={o.mode}
            flex={1}
            alignItems="center"
            justifyContent="center"
            gap={6}
            paddingVertical={8}
            borderRadius={999}
            backgroundColor={active ? c.gold : "transparent"}
            pressStyle={{ opacity: 0.85 }}
            onPress={() => setMode(o.mode)}
          >
            <MIcon name={o.icon} size={16} color={active ? c.onGold : c.muted} />
            <Text fontSize={13} fontWeight="800" color={active ? c.onGold : c.muted}>{o.label}</Text>
          </XStack>
        );
      })}
    </XStack>
  );
}
