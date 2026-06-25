import { createTheme } from "@mui/material/styles";

/**
 * Single MUI theme for the whole admin, mirroring the CSS custom properties in
 * styles.css so MUI components match the existing dark-gold design. Provided
 * once at the app root (main.tsx) so every component inherits it.
 */
export const muiTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#e4b65c", dark: "#b9852f", contrastText: "#2a1a06" },
    secondary: { main: "#6aa3e0" },
    success: { main: "#5fb45f" },
    error: { main: "#e0584b" },
    warning: { main: "#e0a23c" },
    info: { main: "#6aa3e0" },
    background: { paper: "#1d150d", default: "#0c0805" },
    text: { primary: "#f5ece0", secondary: "#b9ad9e" },
    divider: "rgba(232, 200, 140, 0.16)",
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Mulish", system-ui, sans-serif',
    h1: { fontFamily: '"Playfair Display", Georgia, serif' },
    h2: { fontFamily: '"Playfair Display", Georgia, serif' },
    h3: { fontFamily: '"Playfair Display", Georgia, serif' },
    h4: { fontFamily: '"Playfair Display", Georgia, serif' },
    h5: { fontFamily: '"Playfair Display", Georgia, serif' },
    h6: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 800 },
    button: { textTransform: "none", fontWeight: 700 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none", border: "1px solid rgba(232, 200, 140, 0.12)" },
      },
    },
  },
});
