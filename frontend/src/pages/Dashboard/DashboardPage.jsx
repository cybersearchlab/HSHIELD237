import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { fetchCurrentUser, logout } from "../../api/auth";

// Page provisoire — remplacée par le layout applicatif de référence (sidebar/topbar) au jour 4.
export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCurrentUser()
      .then(setUser)
      .catch(() => setError("Impossible de récupérer le profil."));
  }, []);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <main style={{ fontFamily: "sans-serif", padding: 40 }}>
      <h1>H-SHIELD237</h1>
      {error && <p style={{ color: "#C0392B" }}>{error}</p>}
      {user && (
        <p>
          Connecté en tant que <strong>{user.email}</strong> — rôle : {user.role}
        </p>
      )}
      <button onClick={handleLogout}>Se déconnecter</button>
    </main>
  );
}
