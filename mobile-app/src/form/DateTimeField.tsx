import { useState } from "react";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { YStack, XStack, Text } from "tamagui";
import { MIcon, type IconName } from "../components";
import { useColors } from "../theme";

const pad = (n: number) => String(n).padStart(2, "0");

/** Machine string "YYYY-MM-DD" for storage. */
function toDateValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Machine string "HH:mm" (24h) for storage. */
function toTimeValue(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Friendly "15 Aug 2026" label from a "YYYY-MM-DD" value. */
function dateLabel(value: string): string {
  if (!value) return "";
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/** Friendly "7:00 PM" label from a "HH:mm" value. */
function timeLabel(value: string): string {
  if (!value) return "";
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return value;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

interface PickerFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  mode: "date" | "time";
  icon: IconName;
  placeholder: string;
  display: (value: string) => string;
  serialize: (d: Date) => string;
}

/** Shared native picker shell — opens the relevant picker and stores a string. */
function PickerField({
  label,
  value,
  onChange,
  error,
  mode,
  icon,
  placeholder,
  display,
  serialize,
}: Readonly<PickerFieldProps>) {
  const brand = useColors();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Date>(new Date());

  function handle(event: DateTimePickerEvent, selected?: Date) {
    setOpen(false);
    if (event.type === "dismissed") return;
    const chosen = selected ?? picked;
    setPicked(chosen);
    onChange(serialize(chosen));
  }

  return (
    <YStack gap={5} flex={1}>
      <Text fontSize={12} color={brand.muted} fontWeight="700">{label}</Text>
      <XStack
        onPress={() => setOpen(true)}
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
        <Text color={value ? brand.text : brand.faint}>{display(value) || placeholder}</Text>
        <MIcon name={icon} size={18} color={brand.gold} />
      </XStack>
      {error ? <Text fontSize={12} color={brand.red}>{error}</Text> : null}
      {open ? (
        <DateTimePicker
          value={picked}
          mode={mode}
          is24Hour={false}
          minimumDate={mode === "date" ? new Date() : undefined}
          onChange={handle}
        />
      ) : null}
    </YStack>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

/** Native date picker — stores "YYYY-MM-DD". */
export function DateField({ label, value, onChange, error }: Readonly<FieldProps>) {
  return (
    <PickerField
      label={label}
      value={value}
      onChange={onChange}
      error={error}
      mode="date"
      icon="calendar"
      placeholder="Select date"
      display={dateLabel}
      serialize={toDateValue}
    />
  );
}

/** Native time picker — stores "HH:mm". */
export function TimeField({ label, value, onChange, error }: Readonly<FieldProps>) {
  return (
    <PickerField
      label={label}
      value={value}
      onChange={onChange}
      error={error}
      mode="time"
      icon="clock-outline"
      placeholder="Select time"
      display={timeLabel}
      serialize={toTimeValue}
    />
  );
}
