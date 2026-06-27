import { Controller, type Control } from "react-hook-form";
import { Box, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import type { ExpenseSourceForm } from "../../form";

/** Preset palette used to tint a source's rows in the expense grid + PDF. */
export const SOURCE_COLORS = [
  "#e57373", "#f06292", "#ba68c8", "#9575cd", "#7986cb", "#64b5f6",
  "#4db6ac", "#81c784", "#ffd54f", "#ffb74d", "#a1887f", "#90a4ae",
];

function Swatch({ color, selected, onClick }: Readonly<{ color?: string; selected: boolean; onClick: () => void }>) {
  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(); }}
      title={color ?? "None"}
      sx={{
        width: 26, height: 26, borderRadius: "50%", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, color: "text.secondary",
        bgcolor: color ?? "transparent",
        border: 2, borderColor: selected ? "primary.main" : "divider",
      }}
    >
      {selected && color ? <CheckIcon sx={{ fontSize: 16, color: "#1a1206" }} /> : null}
      {color ? null : "—"}
    </Box>
  );
}

/** RHF-bound colour picker (preset swatches + a "None" option). */
export default function SourceColorField({ control }: Readonly<{ control: Control<ExpenseSourceForm> }>) {
  return (
    <Controller
      control={control}
      name="color"
      render={({ field }) => (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
            Row colour (optional)
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Swatch selected={!field.value} onClick={() => field.onChange("")} />
            {SOURCE_COLORS.map((c) => (
              <Swatch key={c} color={c} selected={field.value === c} onClick={() => field.onChange(c)} />
            ))}
          </Box>
        </Box>
      )}
    />
  );
}
