import { Box, Chip, Stack } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
} from "date-fns";

export type Preset = "today" | "tomorrow" | "week" | "month" | "custom";

export interface DateRange {
  from?: string;
  to?: string;
}

const PRESETS: ReadonlyArray<{ value: Preset; label: string }> = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "custom", label: "Custom" },
];

/** Maps a non-custom preset to an ISO `{ from, to }` range using date-fns. */
export function rangeForPreset(preset: Preset, now: Date = new Date()): DateRange {
  if (preset === "tomorrow") {
    const day = addDays(now, 1);
    return { from: startOfDay(day).toISOString(), to: endOfDay(day).toISOString() };
  }
  if (preset === "week") {
    return { from: startOfWeek(now).toISOString(), to: endOfWeek(now).toISOString() };
  }
  if (preset === "month") {
    return { from: startOfMonth(now).toISOString(), to: endOfMonth(now).toISOString() };
  }
  return { from: startOfDay(now).toISOString(), to: endOfDay(now).toISOString() };
}

interface Props {
  preset: Preset;
  customFrom: Date | null;
  customTo: Date | null;
  onPreset: (preset: Preset) => void;
  onCustomFrom: (date: Date | null) => void;
  onCustomTo: (date: Date | null) => void;
}

/** Date-filter toolbar: preset chips plus from/to pickers when "Custom" is active. */
export default function DashboardFilter({
  preset,
  customFrom,
  customTo,
  onPreset,
  onCustomFrom,
  onCustomTo,
}: Readonly<Props>) {
  return (
    <Box className="card" sx={{ p: 2, mb: 2 }}>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {PRESETS.map((p) => (
          <Chip
            key={p.value}
            label={p.label}
            color={preset === p.value ? "primary" : "default"}
            variant={preset === p.value ? "filled" : "outlined"}
            onClick={() => onPreset(p.value)}
          />
        ))}
      </Stack>
      {preset === "custom" && (
        <Stack direction="row" spacing={1.5} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
          <DatePicker
            label="From"
            value={customFrom}
            onChange={onCustomFrom}
            slotProps={{ textField: { size: "small" } }}
          />
          <DatePicker
            label="To"
            value={customTo}
            onChange={onCustomTo}
            slotProps={{ textField: { size: "small" } }}
          />
        </Stack>
      )}
    </Box>
  );
}
