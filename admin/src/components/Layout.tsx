import { useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { useAuth } from "../auth";
import { SETTINGS } from "../graphql/queries";
import {
  IGrid,
  IOrders,
  IMenu,
  ITag,
  ILayers,
  IUsers,
  IRupee,
  IBank,
  IBike,
  IClock,
  IHeadset,
  ISend,
  IPalette,
  ILogout,
} from "./icons";

const NAV = [
  { to: "/", label: "Dashboard", icon: IGrid, end: true },
  { to: "/orders", label: "Orders", icon: IOrders },
  { to: "/payments", label: "Payments", icon: IRupee },
  { to: "/finance", label: "Finance", icon: IBank },
  { to: "/menu", label: "Menu", icon: IMenu },
  { to: "/categories", label: "Categories", icon: ILayers },
  { to: "/coupons", label: "Coupons", icon: ITag },
  { to: "/customers", label: "Customers", icon: IUsers },
  { to: "/riders", label: "Riders", icon: IBike },
  { to: "/support", label: "Support", icon: IHeadset },
  { to: "/campaigns", label: "Campaigns", icon: ISend },
  { to: "/store", label: "Store", icon: IClock },
  { to: "/branding", label: "Branding", icon: IPalette },
];

export default function Layout({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const { data } = useQuery<{ settings?: { maintenance?: { admin?: boolean } } }>(SETTINGS);
  const adminMaintenance = data?.settings?.maintenance?.admin ?? false;

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand">
          <span className="brand__badge" />
          <div>
            <div className="brand__name">Didi Bhaiya</div>
            <div className="brand__sub">Admin Console</div>
          </div>
        </div>

        <nav className="nav" onClick={() => setOpen(false)}>
          {NAV.map((n) => {
            const Icon = n.icon;
            return (
              <NavLink key={n.to} to={n.to} end={n.end}>
                <Icon />
                {n.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar__foot">
          <div className="sidebar__user">
            <b>{user?.name}</b>
            <span>{user?.role}</span>
          </div>
          <button className="logout" onClick={logout}>
            <ILogout size={16} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              className="btn btn-ghost btn-sm menu-toggle"
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              ☰
            </button>
            <h1>{title}</h1>
          </div>
        </header>
        <div className="content">
          {adminMaintenance && (
            <div className="maint-banner">
              ⚠ Maintenance mode is ON for the admin panel — turn it off under Store →
              Maintenance when you're done.
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
