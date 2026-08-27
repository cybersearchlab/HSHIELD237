import { useTheme } from "../../context/ThemeContext";

// Les boutons Rechercher / Notifications / Exporter n'ont jamais eu de
// comportement réel (aucun onClick depuis leur création au jour 4) et
// s'affichaient à l'identique sur toutes les pages — retirés. Le bouton
// « Nouvelle campagne » ne s'affiche désormais que sur la page qui le
// câble réellement (Campagnes), au lieu d'apparaître partout en rouge
// tout en étant desactivé ailleurs.
export default function Topbar({ title, subtitle, actions, onNewCampaign }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1>{title}</h1>
        {subtitle && <span>{subtitle}</span>}
      </div>
      <div className="topbar-right">
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
          aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
          aria-pressed={isDark}
        >
          <i className={`ti ${isDark ? "ti-sun" : "ti-moon"}`} aria-hidden="true" />
          <span>{isDark ? "Mode clair" : "Mode sombre"}</span>
        </button>
        {onNewCampaign && (
          <button className="btn btn-primary" onClick={onNewCampaign}>
            <i className="ti ti-plus" /> Nouvelle campagne
          </button>
        )}
        {actions}
      </div>
    </header>
  );
}
