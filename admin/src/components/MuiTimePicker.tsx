import { ThemeProvider, createTheme } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";

/** Dark MUI theme that matches the admin palette (custom CSS variables). */
const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#e4b65c" },
    background: { paper: "#1d150d", default: "#120c08" },
    text: { primary: "#f5ece0", secondary: "#b9ad9e" },
  },
  shape: { borderRadius: 9 },
  typography: { fontFamily: '"Mulish", system-ui, sans-serif' },
});

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
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <TimePicker
          label={label}
          value={hhmmToDate(value)}
          onChange={(d) => {
            if (d instanceof Date && !Number.isNaN(d.getTime())) onChange(dateToHhmm(d));
          }}
          slotProps={{ textField: { size: "small", fullWidth: true } }}
        />
      </LocalizationProvider>
    </ThemeProvider>
  );
}
