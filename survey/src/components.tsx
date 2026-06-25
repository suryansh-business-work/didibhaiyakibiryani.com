import type { ReactNode } from "react";
import { Box, Container, Rating, Stack, Typography } from "@mui/material";

/** Format a number as Indian rupees. */
export function inr(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

/** Maroon-and-gold brand badge, matching the admin look. */
export function BrandLogo({ size = 64 }: Readonly<{ size?: number }>) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: "2px solid",
        borderColor: "primary.main",
        background: "radial-gradient(circle at 50% 35%, #7a2a1c, #3a0f0c)",
        flexShrink: 0,
      }}
    />
  );
}

/** Full-screen, vertically centered shell used for loading/error/empty states. */
export function Centered({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "grid",
        placeItems: "center",
        p: 3,
      }}
    >
      {children}
    </Box>
  );
}

/** Page wrapper: brand header + centered mobile-first column. */
export function SurveyShell({
  subtitle,
  children,
}: Readonly<{ subtitle?: string; children: ReactNode }>) {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 3, sm: 6 } }}>
      <Container maxWidth="sm">
        <Stack alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
          <BrandLogo size={64} />
          <Typography variant="h5" fontWeight={800} textAlign="center">
            How was your order?
          </Typography>
          {subtitle ? (
            <Typography color="text.secondary" textAlign="center">
              {subtitle}
            </Typography>
          ) : null}
        </Stack>
        {children}
      </Container>
    </Box>
  );
}

/** A label with a (read-only or editable) MUI star rating on the right. */
export function StarRow({
  label,
  value,
  onChange,
}: Readonly<{
  label: string;
  value: number | null;
  onChange?: (v: number | null) => void;
}>) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
      <Typography>{label}</Typography>
      <Rating value={value} readOnly={!onChange} onChange={(_, v) => onChange?.(v)} size="large" />
    </Stack>
  );
}
