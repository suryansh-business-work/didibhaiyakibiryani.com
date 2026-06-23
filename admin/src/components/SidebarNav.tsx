import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Box,
  Collapse,
  InputBase,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { ISearch } from "./icons";
import { NAV_GROUPS } from "./navConfig";

const itemSx = {
  color: "text.secondary",
  borderRadius: 2,
  mb: "2px",
  "& .MuiListItemIcon-root": { color: "text.secondary", minWidth: 32 },
  "&:hover": { bgcolor: "rgba(255,255,255,0.04)", color: "text.primary" },
  "&.active": {
    bgcolor: "rgba(228,182,92,0.13)",
    color: "primary.main",
    "& .MuiListItemIcon-root": { color: "primary.main" },
  },
};

const scrollSx = {
  scrollbarWidth: "thin" as const,
  scrollbarColor: "rgba(228,182,92,0.3) transparent",
  "&::-webkit-scrollbar": { width: 6 },
  "&::-webkit-scrollbar-track": { background: "transparent" },
  "&::-webkit-scrollbar-thumb": { background: "rgba(228,182,92,0.25)", borderRadius: 3 },
  "&::-webkit-scrollbar-thumb:hover": { background: "rgba(228,182,92,0.45)" },
};

export default function SidebarNav({ onNav }: Readonly<{ onNav: () => void }>) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const q = query.trim().toLowerCase();

  const groups = useMemo(() => {
    if (!q) return NAV_GROUPS;
    return NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((it) => it.label.toLowerCase().includes(q)) })).filter(
      (g) => g.items.length > 0
    );
  }, [q]);

  function toggle(label: string) {
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  return (
    <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", mr: -2, pr: 1.5, ...scrollSx }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.25, py: 0.75, mb: 1.25, borderRadius: 2, bgcolor: "rgba(255,255,255,0.05)" }}>
        <Box sx={{ display: "flex", color: "text.secondary" }}><ISearch size={16} /></Box>
        <InputBase
          placeholder="Search menu…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ flex: 1, color: "text.primary", fontSize: "0.88rem", "& input::placeholder": { color: "text.secondary", opacity: 1 } }}
        />
      </Box>

      {groups.map((g) => {
        const isOpen = Boolean(q) || !collapsed[g.label];
        return (
          <Box key={g.label} sx={{ mb: 0.75 }}>
            <Box
              onClick={() => toggle(g.label)}
              sx={{ display: "flex", alignItems: "center", cursor: "pointer", px: 1.25, py: 0.4, userSelect: "none", borderRadius: 1.5, "&:hover": { bgcolor: "rgba(255,255,255,0.03)" } }}
            >
              <Typography variant="caption" sx={{ flex: 1, textTransform: "uppercase", letterSpacing: 1, color: "text.secondary", fontWeight: 700, fontSize: "0.66rem" }}>
                {g.label}
              </Typography>
              {isOpen ? <ExpandLessIcon sx={{ fontSize: 18, color: "text.secondary" }} /> : <ExpandMoreIcon sx={{ fontSize: 18, color: "text.secondary" }} />}
            </Box>
            <Collapse in={isOpen} timeout="auto" unmountOnExit>
              <List disablePadding sx={{ mt: 0.25 }}>
                {g.items.map((n) => {
                  const Icon = n.icon;
                  return (
                    <ListItemButton key={n.to} component={NavLink} to={n.to} end={n.end} onClick={onNav} sx={itemSx}>
                      <ListItemIcon><Icon /></ListItemIcon>
                      <ListItemText primary={n.label} primaryTypographyProps={{ fontSize: "0.9rem", fontWeight: 600 }} />
                    </ListItemButton>
                  );
                })}
              </List>
            </Collapse>
          </Box>
        );
      })}
    </Box>
  );
}
