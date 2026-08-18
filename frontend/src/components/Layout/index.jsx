import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

// Référence visuelle unique du sprint (docs/maquettes/app.html) — importé par
// toutes les pages applicatives. Ne pas dupliquer ou réimproviser la sidebar/topbar.
export default function Layout({ pageTitle, pageSubtitle, actions, onNewCampaign, children }) {
  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Topbar title={pageTitle} subtitle={pageSubtitle} actions={actions} onNewCampaign={onNewCampaign} />
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
