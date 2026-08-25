import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import CampagnesPage from "./pages/Campagnes/CampagnesPage";
import ConsentementsPage from "./pages/Consentements/ConsentementsPage";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import GenererScenarioPage from "./pages/GenererScenario/GenererScenarioPage";
import LoginPage from "./pages/Login/LoginPage";
import RapportsPDFPage from "./pages/RapportsPDF/RapportsPDFPage";
import ResultatsPage from "./pages/Resultats/ResultatsPage";
import ProtectedRoute from "./routes/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/campagnes"
            element={
              <ProtectedRoute>
                <CampagnesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/generer-scenario"
            element={
              <ProtectedRoute>
                <GenererScenarioPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resultats"
            element={
              <ProtectedRoute>
                <ResultatsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rapports"
            element={
              <ProtectedRoute>
                <RapportsPDFPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/consentements"
            element={
              <ProtectedRoute>
                <ConsentementsPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
