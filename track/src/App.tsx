import { Navigate, Route, Routes } from "react-router-dom";
import Track from "./pages/Track";
import MissingOrder from "./pages/MissingOrder";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MissingOrder />} />
      <Route path="/:orderNumber" element={<Track />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
