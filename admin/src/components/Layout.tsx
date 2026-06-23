import { useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useQuery } from "@apollo/client";
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Drawer,
  IconButton,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import BrandLogo from "./BrandLogo";
import SidebarNav from "./SidebarNav";
import { useAuth } from "../auth";
import { SETTINGS } from "../graphql/queries";

const DRAWER_W = 280;

function initials(name?: string): string {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

interface DrawerContentProps {
  name?: string;
  role?: string;
  onNav: () => void;
  onLogout: () => void;
}

function DrawerContent({ name, role, onNav, onLogout }: Readonly<DrawerContentProps>) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", p: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.4, px: 1, pb: 2.5 }}>
        <BrandLogo size={40} />
        <Box>
          <Typography sx={{ fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 800, letterSpacing: 0.5 }}>Didi Bhaiya</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 1 }}>Admin Console</Typography>
        </Box>
      </Box>

      <SidebarNav onNav={onNav} />

      <Box sx={{ borderTop: 1, borderColor: "divider", pt: 1.5, mt: 1 }}>
        <ListItemButton component={NavLink} to="/profile" onClick={onNav} sx={{ borderRadius: 2, "&.active": { bgcolor: "rgba(228,182,92,0.13)" } }}>
          <Avatar sx={{ width: 34, height: 34, mr: 1.25, bgcolor: "primary.main", color: "#1a1206", fontWeight: 800, fontSize: "0.85rem" }}>{initials(name)}</Avatar>
          <ListItemText
            primary={name}
            secondary={role}
            primaryTypographyProps={{ fontWeight: 700, fontSize: "0.9rem", noWrap: true }}
            secondaryTypographyProps={{ fontSize: "0.7rem", color: "text.secondary" }}
          />
        </ListItemButton>
        <Button onClick={onLogout} startIcon={<LogoutIcon />} color="inherit" fullWidth sx={{ justifyContent: "flex-start", mt: 1, color: "text.secondary", "&:hover": { color: "error.main", bgcolor: "rgba(224,88,75,0.12)" } }}>
          Sign out
        </Button>
      </Box>
    </Box>
  );
}

export default function Layout({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data } = useQuery<{ settings?: { maintenance?: { admin?: boolean } } }>(SETTINGS);
  const adminMaintenance = data?.settings?.maintenance?.admin ?? false;

  const drawer = <DrawerContent name={user?.name} role={user?.role} onNav={() => setMobileOpen(false)} onLogout={logout} />;
  const paperSx = { width: DRAWER_W, boxSizing: "border-box", background: "linear-gradient(180deg, #140d08, #0b0705)" };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_W}px)` },
          ml: { md: `${DRAWER_W}px` },
          bgcolor: "rgba(12,8,5,0.85)",
          backdropFilter: "blur(10px)",
          borderBottom: 1,
          borderColor: "divider",
          color: "text.primary",
        }}
      >
        <Toolbar>
          <IconButton onClick={() => setMobileOpen(true)} edge="start" sx={{ mr: 1, display: { md: "none" } }} aria-label="Open menu">
            <MenuIcon />
          </IconButton>
          <Typography variant="h6">{title}</Typography>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: DRAWER_W }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": paperSx }}
        >
          {drawer}
        </Drawer>
        <Drawer variant="permanent" open sx={{ display: { xs: "none", md: "block" }, "& .MuiDrawer-paper": paperSx }}>
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, width: { md: `calc(100% - ${DRAWER_W}px)` } }}>
        <Toolbar />
        <Box sx={{ p: { xs: 2, md: 3.5 } }}>
          {adminMaintenance && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Maintenance mode is ON for the admin panel — turn it off under Store → Maintenance when you're done.
            </Alert>
          )}
          {children}
        </Box>
      </Box>
    </Box>
  );
}
