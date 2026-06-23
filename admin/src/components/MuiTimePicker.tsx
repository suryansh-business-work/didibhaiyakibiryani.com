import { TimePicker } from "@mui/x-date-pickers/TimePicker";

/** "HH:mm" (24h, how store hours are stored) → a Date for the picker. */
function hhmmToDate(value: string): Date | null {
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h)) return null;
  const d = new Date();
  d.setHours(h, Number.isNaN(m) ? 0 : m, 0, 0);
  return d;
}

function dateToHhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

interface MuiTimePickerProps {
  label: string;
  /** Stored value as 24h "HH:mm". */
  value: string;
  onChange: (value: string) => void;
}

/**
 * MUI X TimePicker bound to a 24h "HH:mm" string. The picker itself shows the
 * 12-hour AM/PM clock (the user's local format); we persist 24h for the API.
 */
export default function MuiTimePicker({ label, value, onChange }: Readonly<MuiTimePickerProps>) {
  return (
    <TimePicker
      label={label}
      value={hhmmToDate(value)}
      onChange={(d) => {
        if (d instanceof Date && !Number.isNaN(d.getTime())) onChange(dateToHhmm(d));
      }}
      slotProps={{ textField: { size: "small", fullWidth: true } }}
    />
  );
}
