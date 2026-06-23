import { Box, FormControlLabel, Switch as MuiSwitch, Typography } from "@mui/material";

interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}

/** Labelled MUI toggle with an optional hint line, used in settings pages. */
export default function Switch({ checked, onChange, label, hint, disabled }: Readonly<SwitchProps>) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        py: 1.25,
        borderBottom: 1,
        borderColor: "divider",
        "&:last-of-type": { borderBottom: 0 },
      }}
    >
      <Box>
        <Typography fontWeight={700}>{label}</Typography>
        {hint ? <Typography variant="caption" color="text.secondary">{hint}</Typography> : null}
      </Box>
      <FormControlLabel
        sx={{ m: 0 }}
        label=""
        control={<MuiSwitch checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />}
      />
    </Box>
  );
}
