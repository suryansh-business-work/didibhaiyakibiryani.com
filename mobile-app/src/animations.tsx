import type { ReactNode } from "react";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInDown,
} from "react-native-reanimated";

/**
 * Shared entering animations so every screen moves the same way.
 * Reanimated layout animations run on the UI thread (and degrade gracefully
 * to CSS transitions on web).
 */

interface AnimatedBlockProps {
  children: ReactNode;
  /** Stagger position — each step delays the entrance slightly. */
  index?: number;
}

const STEP_MS = 55;
const MAX_STEPS = 10; // long lists shouldn't make the tail wait forever

function delayFor(index = 0): number {
  return Math.min(index, MAX_STEPS) * STEP_MS;
}

/** Card sliding up into place — menu items, order cards, list rows. */
export function RiseIn({ children, index }: Readonly<AnimatedBlockProps>) {
  return (
    <Animated.View entering={FadeInDown.duration(360).delay(delayFor(index))}>
      {children}
    </Animated.View>
  );
}

/** Soft fade for headers and section blocks. */
export function FadeInView({ children, index }: Readonly<AnimatedBlockProps>) {
  return (
    <Animated.View entering={FadeIn.duration(420).delay(delayFor(index))}>
      {children}
    </Animated.View>
  );
}

/** Content dropping in from above — banners, alerts. */
export function DropIn({ children, index }: Readonly<AnimatedBlockProps>) {
  return (
    <Animated.View entering={FadeInUp.duration(360).delay(delayFor(index))}>
      {children}
    </Animated.View>
  );
}

/** Bottom bars (cart bar, sticky CTAs) springing up from the bottom edge. */
export function SpringUp({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <Animated.View
      entering={SlideInDown.springify().damping(18).stiffness(160)}
      style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
    >
      {children}
    </Animated.View>
  );
}
