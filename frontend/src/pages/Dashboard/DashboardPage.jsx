import { useNavigate } from "react-router-dom";

import { logout } from "../../api/auth";
import Layout from "../../components/Layout";
import { useAuth } from "../../context/AuthContext";

// Contenu provisoire — les indicateurs réels (campagnes, score de vulnérabilité…)
// seront branchés au fil du sprint (jours 6 à 12). Le layout, lui, est désormais définitif.
export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <Layout
      pageTitle="Tableau de bord"
      actions={
        <button className="btn" onClick={handleLogout}>
          <i className="ti ti-logout" /> Se déconnecter
        </button>
      }
    >
      {user && (
        <p style={{ color: "var(--text2)" }}>
          Connecté en tant que <strong>{user.email}</strong> ({user.role})
        </p>
      )}
    </Layout>
  );
}
