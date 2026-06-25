import { Navigate, Route, Routes } from "react-router-dom";
import SurveyPage from "./SurveyPage";
import MissingOrder from "./MissingOrder";

export default function App() {
  return (
    <Routes>
      {/* Public, no-login order-rating survey, keyed by order number. */}
      <Route path="/" element={<MissingOrder />} />
      <Route path="/:orderNumber" element={<SurveyPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
