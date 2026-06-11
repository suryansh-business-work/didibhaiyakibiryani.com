import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../auth";

/** Mobile-first shell for riders: brand bar, tab nav, content. */
export default function Shell({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  const { user, logout } = useAuth();

  return (
    <div className="rider-shell">
      <header className="rider-top">
        <div>
          <div className="rider-brand">Didi Bhaiya · Delivery</div>
          <h1>{title}</h1>
        </div>
        <div className="rider-user">
          <span className="muted">{user?.name}</span>
          <button className="logout" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      <nav className="rider-tabs">
        <NavLink to="/" end>
          🛵 My queue
        </NavLink>
        <NavLink to="/earnings">💰 Earnings</NavLink>
        <NavLink to="/support">🎧 Support</NavLink>
      </nav>

      <main className="rider-content">{children}</main>
    </div>
  );
}
