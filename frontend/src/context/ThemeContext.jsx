import { createContext, useContext, useEffect, useState } from "react";

// Bascule clair / sombre pour toute l'application. Le choix est mémorisé
// dans localStorage (repris à la reconnexion) et, à défaut, aligné sur la
// préférence système du navigateur. Le thème actif est posé en attribut
// data-theme sur <html>, lu par les variables CSS de src/index.css.
const ThemeContext = createContext(null);
const STORAGE_KEY = "hshield-theme";

function getInitialTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // localStorage indisponible (navigation privée, etc.) — on se rabat
    // sur la préférence système ci-dessous.
  }
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // pas grave si la préférence n'est pas mémorisée (mode privé)
    }
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme doit être utilisé à l'intérieur de <ThemeProvider>.");
  return ctx;
}
