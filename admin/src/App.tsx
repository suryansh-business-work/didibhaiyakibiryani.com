import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth";
import { Spinner } from "./components/ui";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import ComplimentaryItems from "./pages/ComplimentaryItems";
import Menu from "./pages/Menu";
import Categories from "./pages/Categories";
import Slider from "./pages/Slider";
import Societies from "./pages/Societies";
import PartyOrders from "./pages/PartyOrders";
import Coupons from "./pages/Coupons";
import Customers from "./pages/Customers";
import Contacts from "./pages/Contacts";
import Profile from "./pages/Profile";
import MessageConfig from "./pages/MessageConfig";
import Branding from "./pages/Branding";
import Integrations from "./pages/Integrations";
import Payments from "./pages/Payments";
import Campaigns from "./pages/Campaigns";
import Finance from "./pages/Finance";
import ExpenseSources from "./pages/ExpenseSources";
import Expenses from "./pages/Expenses";
import RawItems from "./pages/RawItems";
import Store from "./pages/Store";
import Riders from "./pages/Riders";
import Support from "./pages/Support";
import BrandTheme from "./BrandTheme";
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
    <>
    <BrandTheme />
    <Routes>
      {/* The customer survey + live tracking now live in their own public apps
          (survey./track. subdomains), keyed by order number. */}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<Protected><Dashboard /></Protected>} />
      <Route path="/orders" element={<Protected><Orders /></Protected>} />
      <Route path="/complimentary" element={<Protected><ComplimentaryItems /></Protected>} />
      <Route path="/menu" element={<Protected><Menu /></Protected>} />
      <Route path="/categories" element={<Protected><Categories /></Protected>} />
      <Route path="/slider" element={<Protected><Slider /></Protected>} />
      <Route path="/societies" element={<Protected><Societies /></Protected>} />
      <Route path="/party-orders" element={<Protected><PartyOrders /></Protected>} />
      <Route path="/coupons" element={<Protected><Coupons /></Protected>} />
      <Route path="/customers" element={<Protected><Customers /></Protected>} />
      <Route path="/contacts" element={<Protected><Contacts /></Protected>} />
      <Route path="/profile" element={<Protected><Profile /></Protected>} />
      <Route path="/messages/tracking" element={<Protected><MessageConfig kind="tracking" /></Protected>} />
      <Route path="/messages/survey" element={<Protected><MessageConfig kind="survey" /></Protected>} />
      <Route path="/messages/receipt" element={<Protected><MessageConfig kind="receipt" /></Protected>} />
      <Route path="/branding" element={<Protected><Branding /></Protected>} />
      <Route path="/integrations" element={<Protected><Integrations /></Protected>} />
      <Route path="/payments" element={<Protected><Payments /></Protected>} />
      <Route path="/campaigns" element={<Protected><Campaigns /></Protected>} />
      <Route path="/finance" element={<Protected><Finance /></Protected>} />
      <Route path="/expense-sources" element={<Protected><ExpenseSources /></Protected>} />
      <Route path="/expenses" element={<Protected><Expenses /></Protected>} />
      <Route path="/raw-items" element={<Protected><RawItems /></Protected>} />
      <Route path="/store" element={<Protected><Store /></Protected>} />
      <Route path="/riders" element={<Protected><Riders /></Protected>} />
      <Route path="/support" element={<Protected><Support /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}
