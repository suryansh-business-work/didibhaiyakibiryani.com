import { useState } from "react";
import { ScrollView } from "react-native";
import { YStack, XStack, Text } from "tamagui";
import { MIcon } from "../components";
import { useColors } from "../theme";

const LETTERS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

interface BlockPickerProps {
  label: string;
  value: string;
  onChange: (block: string) => void;
  error?: string;
}

/** Dropdown to pick a building block A–Z. */
export function BlockPicker({ label, value, onChange, error }: Readonly<BlockPickerProps>) {
  const brand = useColors();
  const [open, setOpen] = useState(false);

  return (
    <YStack gap={5}>
      <Text fontSize={12} color={brand.muted} fontWeight="700">{label}</Text>
      <XStack
        onPress={() => setOpen((o) => !o)}
        alignItems="center"
        justifyContent="space-between"
        backgroundColor={brand.bgSoft}
        borderColor={error ? brand.red : brand.borderStrong}
        borderWidth={1}
        borderRadius={9}
        paddingHorizontal={12}
        paddingVertical={12}
        pressStyle={{ opacity: 0.85 }}
      >
        <Text color={value ? brand.text : brand.faint}>{value ? `Block ${value}` : "Select block"}</Text>
        <MIcon name={open ? "chevron-up" : "chevron-down"} size={18} color={brand.gold} />
      </XStack>

      {open ? (
        <YStack
          maxHeight={210}
          backgroundColor={brand.bgSoft}
          borderColor={brand.borderStrong}
          borderWidth={1}
          borderRadius={9}
          overflow="hidden"
        >
          <ScrollView nestedScrollEnabled>
            {LETTERS.map((l) => (
              <XStack
                key={l}
                onPress={() => {
                  onChange(l);
                  setOpen(false);
                }}
                paddingVertical={11}
                paddingHorizontal={14}
                backgroundColor={value === l ? "rgba(228,182,92,0.16)" : "transparent"}
                pressStyle={{ backgroundColor: "rgba(255,255,255,0.05)" }}
              >
                <Text color={value === l ? brand.gold : brand.text} fontWeight={value === l ? "800" : "600"}>
                  Block {l}
                </Text>
              </XStack>
            ))}
          </ScrollView>
        </YStack>
      ) : null}

      {error ? <Text fontSize={12} color={brand.red}>{error}</Text> : null}
    </YStack>
  );
}
