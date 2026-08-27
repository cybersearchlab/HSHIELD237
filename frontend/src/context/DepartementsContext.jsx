import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { listDepartements } from "../api/departements";
import { useAuth } from "./AuthContext";

// Registre des départements de l'entreprise, géré par l'administrateur
// (voir DepartementsPage). Remplace l'ancienne liste figée de 10
// départements (frontend/src/utils/departements.js) — chargé une seule
// fois par session, utilisé partout où un code de département doit être
// affiché ou proposé dans un formulaire.
const DepartementsContext = createContext(null);

export function DepartementsProvider({ children }) {
  const { user } = useAuth();
  const [departements, setDepartements] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setDepartements([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await listDepartements();
      setDepartements(data);
    } catch {
      setDepartements([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const labelFor = useMemo(() => {
    const parCode = Object.fromEntries(departements.map((d) => [d.code, d.nom]));
    return (code) => parCode[code] || code;
  }, [departements]);

  return (
    <DepartementsContext.Provider value={{ departements, labelFor, loading, refresh }}>
      {children}
    </DepartementsContext.Provider>
  );
}

export function useDepartements() {
  const ctx = useContext(DepartementsContext);
  if (!ctx) {
    throw new Error("useDepartements doit être utilisé à l'intérieur de <DepartementsProvider>.");
  }
  return ctx;
}
