import { useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../auth";
import {
  IGrid,
  IOrders,
  IMenu,
  ITag,
  ILayers,
  IUsers,
  ILogout,
} from "./icons";

const NAV = [
  { to: "/", label: "Dashboard", icon: IGrid, end: true },
  { to: "/orders", label: "Orders", icon: IOrders },
  { to: "/menu", label: "Menu", icon: IMenu },
  { to: "/categories", label: "Categories", icon: ILayers },
  { to: "/coupons", label: "Coupons", icon: ITag },
  { to: "/customers", label: "Customers", icon: IUsers },
];

export default function Layout({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

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
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
