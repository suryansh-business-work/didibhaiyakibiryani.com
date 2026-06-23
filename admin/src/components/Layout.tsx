import { useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useQuery } from "@apollo/client";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import BrandLogo from "./BrandLogo";
import { useAuth } from "../auth";
import { SETTINGS } from "../graphql/queries";
import {
  IGrid,
  IOrders,
  IMenu,
  ITag,
  ILayers,
  IImage,
  IBuilding,
  IParty,
  IUsers,
  IRupee,
  IBank,
  IBike,
  IClock,
  IHeadset,
  ISend,
  IPalette,
  IPlug,
} from "./icons";

const DRAWER_W = 246;

const NAV = [
  { to: "/", label: "Dashboard", icon: IGrid, end: true },
  { to: "/orders", label: "Orders", icon: IOrders },
  { to: "/payments", label: "Payments", icon: IRupee },
  { to: "/finance", label: "Finance", icon: IBank },
  { to: "/menu", label: "Menu", icon: IMenu },
  { to: "/categories", label: "Categories", icon: ILayers },
  { to: "/slider", label: "Slider", icon: IImage },
  { to: "/societies", label: "Societies", icon: IBuilding },
  { to: "/coupons", label: "Coupons", icon: ITag },
  { to: "/party-orders", label: "Party Orders", icon: IParty },
  { to: "/customers", label: "Customers", icon: IUsers },
  { to: "/riders", label: "Riders", icon: IBike },
  { to: "/support", label: "Support", icon: IHeadset },
  { to: "/campaigns", label: "Campaigns", icon: ISend },
  { to: "/store", label: "Store", icon: IClock },
  { to: "/branding", label: "Branding", icon: IPalette },
  { to: "/integrations", label: "Integrations", icon: IPlug },
];

const activeSx = {
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

      <List sx={{ flex: 1, overflowY: "auto" }}>
        {NAV.map((n) => {
          const Icon = n.icon;
          return (
            <ListItemButton key={n.to} component={NavLink} to={n.to} end={n.end} onClick={onNav} sx={activeSx}>
              <ListItemIcon><Icon /></ListItemIcon>
              <ListItemText primary={n.label} primaryTypographyProps={{ fontSize: "0.92rem", fontWeight: 600 }} />
            </ListItemButton>
          );
        })}
      </List>

      <Box sx={{ borderTop: 1, borderColor: "divider", pt: 1.5 }}>
        <Typography variant="body2" fontWeight={700}>{name}</Typography>
        <Typography variant="caption" color="text.secondary">{role}</Typography>
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
