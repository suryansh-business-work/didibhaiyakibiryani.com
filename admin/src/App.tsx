import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth";
import { Spinner } from "./components/ui";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Menu from "./pages/Menu";
import Categories from "./pages/Categories";
import Coupons from "./pages/Coupons";
import Customers from "./pages/Customers";
import Branding from "./pages/Branding";
import Payments from "./pages/Payments";
import Campaigns from "./pages/Campaigns";
import Finance from "./pages/Finance";
import Store from "./pages/Store";
import Riders from "./pages/Riders";
import Support from "./pages/Support";
import type { ReactNode } from "react";

function Protected({ children }: Readonly<{ children: ReactNode }>) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner label="Loading…" />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<Protected><Dashboard /></Protected>} />
      <Route path="/orders" element={<Protected><Orders /></Protected>} />
      <Route path="/menu" element={<Protected><Menu /></Protected>} />
      <Route path="/categories" element={<Protected><Categories /></Protected>} />
      <Route path="/coupons" element={<Protected><Coupons /></Protected>} />
      <Route path="/customers" element={<Protected><Customers /></Protected>} />
      <Route path="/branding" element={<Protected><Branding /></Protected>} />
      <Route path="/payments" element={<Protected><Payments /></Protected>} />
      <Route path="/campaigns" element={<Protected><Campaigns /></Protected>} />
      <Route path="/finance" element={<Protected><Finance /></Protected>} />
      <Route path="/store" element={<Protected><Store /></Protected>} />
      <Route path="/riders" element={<Protected><Riders /></Protected>} />
      <Route path="/support" element={<Protected><Support /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
