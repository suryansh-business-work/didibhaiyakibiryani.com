import type { ReactNode } from "react";
import { YStack, XStack, Text, Input, Button } from "tamagui";
import { brand } from "../theme";

export function Section({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <YStack gap={10}>
      <Text fontWeight="800" color={brand.text} fontSize={16}>
        {title}
      </Text>
      {children}
    </YStack>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (s: string) => void;
  keyboard?: "default" | "number-pad" | "phone-pad";
}

export function Field({ label, value, onChange, keyboard }: Readonly<FieldProps>) {
  return (
    <YStack gap={5}>
      <Text fontSize={12} color={brand.muted} fontWeight="700">
        {label}
      </Text>
      <Input
        value={value}
        onChangeText={onChange}
        keyboardType={keyboard ?? "default"}
        backgroundColor={brand.bgSoft}
        borderColor={brand.borderStrong}
        color={brand.text}
      />
    </YStack>
  );
}

interface PayOptionProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

export function PayOption({ label, active, onPress }: Readonly<PayOptionProps>) {
  return (
    <Button
      flex={1}
      onPress={onPress}
      backgroundColor={active ? "rgba(228,182,92,0.16)" : brand.card}
      borderColor={active ? brand.goldDeep : brand.border}
      borderWidth={1}
      color={active ? brand.gold : brand.dim}
      fontWeight="700"
      pressStyle={{ scale: 0.97 }}
    >
      {label}
    </Button>
  );
}

export function Row({ k, v, strong }: Readonly<{ k: string; v: string; strong?: boolean }>) {
  return (
    <XStack justifyContent="space-between">
      <Text color={strong ? brand.text : brand.dim} fontWeight={strong ? "800" : "400"} fontSize={strong ? 17 : 14}>
        {k}
      </Text>
      <Text color={strong ? brand.gold : brand.dim} fontWeight={strong ? "800" : "600"} fontSize={strong ? 17 : 14}>
        {v}
      </Text>
    </XStack>
  );
}

/** Inline notice (replaces Alert boxes so the message also shows on web). */
export function Notice({ kind, children }: Readonly<{ kind: "error" | "warn"; children: ReactNode }>) {
  const color = kind === "error" ? brand.red : brand.gold;
  const bg = kind === "error" ? "rgba(224,88,75,0.12)" : "rgba(228,182,92,0.12)";
  return (
    <XStack backgroundColor={bg} borderColor={color} borderWidth={1} borderRadius={10} padding={12}>
      <Text color={color} fontSize={13} fontWeight="700" flex={1}>
        {children}
      </Text>
    </XStack>
  );
}
