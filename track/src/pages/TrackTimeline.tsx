import { Box, Stack, Typography } from "@mui/material";
import type { OrderStatus } from "../graphql";
import { TIMELINE_STEPS, formatDateTime, stepIndex, stepLabel } from "./statusMeta";

interface HistoryEntry {
  status: OrderStatus;
  at: string;
}

interface Props {
  status: OrderStatus;
  history: ReadonlyArray<HistoryEntry>;
}

// Last timestamp recorded for a given step, if any.
function timestampFor(history: ReadonlyArray<HistoryEntry>, step: OrderStatus): string | null {
  let found: string | null = null;
  for (const entry of history) {
    if (entry.status === step) {
      found = entry.at;
    }
  }
  return found;
}

interface StepRowProps {
  step: OrderStatus;
  done: boolean;
  isLast: boolean;
  timestamp: string | null;
}

function StepRow({ step, done, isLast, timestamp }: Readonly<StepRowProps>) {
  const dotColor = done ? "primary.main" : "divider";
  const textColor = done ? "text.primary" : "text.secondary";
  return (
    <Stack direction="row" spacing={1.5} alignItems="stretch">
      <Stack alignItems="center" sx={{ width: 16 }}>
        <Box
          sx={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            bgcolor: dotColor,
            mt: 0.4,
            flex: "0 0 auto",
          }}
        />
        {isLast ? null : (
          <Box sx={{ flex: 1, width: 2, bgcolor: "divider", mt: 0.5, minHeight: 22 }} />
        )}
      </Stack>
      <Box sx={{ pb: isLast ? 0 : 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 700, color: textColor }}>
          {stepLabel(step)}
        </Typography>
        {timestamp ? (
          <Typography variant="caption" color="text.secondary">
            {formatDateTime(timestamp)}
          </Typography>
        ) : null}
      </Box>
    </Stack>
  );
}

export default function TrackTimeline({ status, history }: Readonly<Props>) {
  const currentIndex = stepIndex(status);
  return (
    <Box>
      {TIMELINE_STEPS.map((step, index) => (
        <StepRow
          key={step}
          step={step}
          done={index <= currentIndex}
          isLast={index === TIMELINE_STEPS.length - 1}
          timestamp={timestampFor(history, step)}
        />
      ))}
    </Box>
  );
}
