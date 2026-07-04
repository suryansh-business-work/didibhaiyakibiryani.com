import type { ReactNode } from "react";
import { View } from "react-native";

/**
 * Motion has been intentionally removed app-wide — these wrappers now render
 * their children statically (no entrance/spring animations). They are kept as
 * thin pass-throughs so call sites don't change and layout stays identical.
 */

interface AnimatedBlockProps {
  children: ReactNode;
  /** Accepted for call-site compatibility; no longer used. */
  index?: number;
}

export function RiseIn({ children }: Readonly<AnimatedBlockProps>) {
  return <View>{children}</View>;
}

export function FadeInView({ children }: Readonly<AnimatedBlockProps>) {
  return <View>{children}</View>;
}

export function DropIn({ children }: Readonly<AnimatedBlockProps>) {
  return <View>{children}</View>;
}

/** Bottom bars (cart bar, sticky CTAs) pinned above the tab bar / safe area. */
export function SpringUp({ children, bottom = 0 }: Readonly<{ children: ReactNode; bottom?: number }>) {
  return <View style={{ position: "absolute", left: 0, right: 0, bottom }}>{children}</View>;
}
