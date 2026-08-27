import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { DepartementsProvider } from "./context/DepartementsContext";
import { ThemeProvider } from "./context/ThemeContext";
import CampagnesPage from "./pages/Campagnes/CampagnesPage";
import ConsentementsPage from "./pages/Consentements/ConsentementsPage";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import DepartementsPage from "./pages/Departements/DepartementsPage";
import EmployesPage from "./pages/Employes/EmployesPage";
import GenererScenarioPage from "./pages/GenererScenario/GenererScenarioPage";
import HistoriquePage from "./pages/Historique/HistoriquePage";
import LoginPage from "./pages/Login/LoginPage";
import RapportsPDFPage from "./pages/RapportsPDF/RapportsPDFPage";
import ResponsablesPage from "./pages/Responsables/ResponsablesPage";
import ResultatsPage from "./pages/Resultats/ResultatsPage";
import TemplatesDepartementPage from "./pages/TemplatesDepartement/TemplatesDepartementPage";
import ProtectedRoute from "./routes/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <DepartementsProvider>
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
              <Route
                path="/responsables"
                element={
                  <ProtectedRoute>
                    <ResponsablesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/departements"
                element={
                  <ProtectedRoute>
                    <DepartementsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employes"
                element={
                  <ProtectedRoute>
                    <EmployesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/templates"
                element={
                  <ProtectedRoute>
                    <TemplatesDepartementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/historique"
                element={
                  <ProtectedRoute>
                    <HistoriquePage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </DepartementsProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
