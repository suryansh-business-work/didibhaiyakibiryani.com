import { Navigate, Route, Routes } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { useAuth } from "./auth";
import { Spinner } from "./components/ui";
import { SETTINGS_LITE } from "./graphql";
import Login from "./pages/Login";
import Queue from "./pages/Queue";
import Earnings from "./pages/Earnings";
import Support from "./pages/Support";
import type { ReactNode } from "react";

function Protected({ children }: Readonly<{ children: ReactNode }>) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner label="Loading…" />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function MaintenanceScreen() {
  return (
    <div className="login-wrap">
      <div className="login-card" style={{ textAlign: "center" }}>
        <div style={{ fontSize: "2.6rem", marginBottom: 10 }}>🛠️</div>
        <h2>Back soon</h2>
        <p className="sub">
          The delivery portal is down for maintenance. Please check back in a bit.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const { user } = useAuth();
  const { data } = useQuery<{ settings?: { maintenance?: { delivery?: boolean } } }>(
    SETTINGS_LITE
  );

  if (data?.settings?.maintenance?.delivery) {
    return <MaintenanceScreen />;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<Protected><Queue /></Protected>} />
      <Route path="/earnings" element={<Protected><Earnings /></Protected>} />
      <Route path="/support" element={<Protected><Support /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
