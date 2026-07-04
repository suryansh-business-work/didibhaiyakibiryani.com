import { Platform } from "react-native";
import { createTamagui } from "tamagui";
import { config } from "@tamagui/config/v3";

// On web, route every font family through the `--app-font` CSS variable so the
// admin-selected Google font (set at runtime by BrandFont) applies everywhere.
// On native the default (system) font is used — custom fonts must be bundled.
const WEB_FONT = "var(--app-font), system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

function brandConfig() {
  if (Platform.OS !== "web") {
    return config;
  }
  return {
    ...config,
    fonts: {
      ...config.fonts,
      heading: { ...config.fonts.heading, family: WEB_FONT },
      body: { ...config.fonts.body, family: WEB_FONT },
    },
  };
}

export const tamaguiConfig = createTamagui(brandConfig());

export default tamaguiConfig;

export type Conf = typeof tamaguiConfig;

declare module "tamagui" {
  // overrides the default Tamagui types with our config
  interface TamaguiCustomConfig extends Conf {}
}
