import { useState } from "react";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { YStack, XStack, Text } from "tamagui";
import { MIcon } from "../components";
import { brand } from "../theme";

/** Human-readable "15 Aug 2026, 7:00 PM" used as the stored event-date string. */
function formatDateTime(d: Date): string {
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface DateTimeFieldProps {
  label: string;
  value: string;
  onChange: (display: string) => void;
  error?: string;
}

/**
 * A native date + time picker. Tapping opens the date picker, then the time
 * picker; the combined value is stored as a friendly display string.
 */
export function DateTimeField({ label, value, onChange, error }: Readonly<DateTimeFieldProps>) {
  const [stage, setStage] = useState<"date" | "time" | null>(null);
  const [picked, setPicked] = useState<Date>(new Date());

  function open() {
    setPicked(new Date());
    setStage("date");
  }

  function handle(event: DateTimePickerEvent, selected?: Date) {
    if (event.type === "dismissed") {
      setStage(null);
      return;
    }
    const chosen = selected ?? picked;
    if (stage === "date") {
      const next = new Date(picked);
      next.setFullYear(chosen.getFullYear(), chosen.getMonth(), chosen.getDate());
      setPicked(next);
      setStage("time");
    } else {
      const next = new Date(picked);
      next.setHours(chosen.getHours(), chosen.getMinutes(), 0, 0);
      setStage(null);
      onChange(formatDateTime(next));
    }
  }

  return (
    <YStack gap={5}>
      <Text fontSize={12} color={brand.muted} fontWeight="700">{label}</Text>
      <XStack
        onPress={open}
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
        <Text color={value ? brand.text : brand.faint}>{value || "Select date & time"}</Text>
        <MIcon name="calendar-clock" size={18} color={brand.gold} />
      </XStack>
      {error ? <Text fontSize={12} color={brand.red}>{error}</Text> : null}
      {stage ? (
        <DateTimePicker
          value={picked}
          mode={stage}
          is24Hour={false}
          minimumDate={stage === "date" ? new Date() : undefined}
          onChange={handle}
        />
      ) : null}
    </YStack>
  );
}
