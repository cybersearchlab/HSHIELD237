export default function Topbar({ title, subtitle, actions }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1>{title}</h1>
        {subtitle && <span>{subtitle}</span>}
      </div>
      <div className="topbar-right">
        <button className="btn btn-icon" aria-label="Rechercher">
          <i className="ti ti-search" />
        </button>
        <button className="btn btn-icon" aria-label="Notifications" style={{ position: "relative" }}>
          <i className="ti ti-bell" />
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 7,
              height: 7,
              background: "var(--red)",
              borderRadius: "50%",
              border: "1.5px solid #fff",
            }}
          />
        </button>
        <button className="btn">
          <i className="ti ti-download" /> Exporter
        </button>
        <button className="btn btn-primary">
          <i className="ti ti-plus" /> Nouvelle campagne
        </button>
        {actions}
      </div>
    </header>
  );
}
