import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createCampagne, deleteCampagne, listCampagnes, updateCampagne } from "../../api/campagnes";
import Layout from "../../components/Layout";

const STATUT_LABELS = {
  brouillon: "Brouillon",
  en_attente: "En attente",
  active: "Active",
  terminee: "Terminée",
};

const STATUT_PILL_CLASS = {
  brouillon: "s-draft dot-draft",
  en_attente: "s-pending dot-pending",
  active: "s-active dot-active",
  terminee: "s-done dot-done",
};

const STATUT_FILTERS = [
  { key: "all", label: "Toutes" },
  { key: "brouillon", label: "Brouillon" },
  { key: "en_attente", label: "En attente" },
  { key: "active", label: "Active" },
  { key: "terminee", label: "Terminée" },
];

const DEPARTEMENT_LABELS = {
  direction: "Direction générale",
  rh: "Ressources humaines",
  comptabilite: "Comptabilité / Finance",
  it: "Informatique",
  commercial: "Commercial / Ventes",
  juridique: "Juridique",
  marketing: "Marketing / Communication",
  production: "Production / Opérations",
  achats: "Achats / Logistique",
  autre: "Autre",
};

const TOAST_ICONS = { success: "ti-check", info: "ti-info-circle", error: "ti-alert-circle" };
const TOAST_COLORS = { success: "#4ADE80", info: "#60A5FA", error: "#F87171" };

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function CampagnesPage() {
  const [statutFilter, setStatutFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [data, setData] = useState({ count: 0, next: null, previous: null, results: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formDepartement, setFormDepartement] = useState("direction");
  const [formStatut, setFormStatut] = useState("brouillon");
  const [formPerimetreValide, setFormPerimetreValide] = useState(false);

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  function showToast(message, type = "info") {
    clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listCampagnes({ statut: statutFilter, page });
      setData(result);
    } catch (err) {
      const status = err.response?.status;
      setError(
        status === 403
          ? "Accès réservé aux rôles consultant et administrateur."
          : "Impossible de charger les campagnes."
      );
    } finally {
      setLoading(false);
    }
  }, [statutFilter, page]);

  useEffect(() => {
    load();
  }, [load]);

  function handleFilterClick(key) {
    setStatutFilter(key);
    setPage(1);
  }

  // Recherche appliquée côté client, sur la page actuellement chargée
  // (l'API ne propose pas encore de recherche texte côté serveur).
  const visibleResults = useMemo(() => {
    if (!search.trim()) return data.results;
    const q = search.trim().toLowerCase();
    return data.results.filter((c) => (c.departement_display || "").toLowerCase().includes(q));
  }, [data.results, search]);

  async function handleLancer(campagne) {
    try {
      await updateCampagne(campagne.id, { statut: "active" });
      showToast(`Campagne lancée pour ${campagne.departement_display}`, "success");
      load();
    } catch {
      showToast("Impossible de lancer cette campagne.", "error");
    }
  }

  async function handleSupprimer(campagne) {
    if (
      !window.confirm(`Supprimer la campagne du département ${campagne.departement_display} ? Cette action est irréversible.`)
    ) {
      return;
    }
    try {
      await deleteCampagne(campagne.id);
      showToast("Campagne supprimée.", "success");
      load();
    } catch {
      showToast("Impossible de supprimer cette campagne.", "error");
    }
  }

  function openModal() {
    setFormDepartement("direction");
    setFormStatut("brouillon");
    setFormPerimetreValide(false);
    setModalOpen(true);
  }

  async function handleCreate(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await createCampagne({
        departement: formDepartement,
        statut: formStatut,
        perimetre_valide: formPerimetreValide,
      });
      setModalOpen(false);
      showToast("Campagne créée.", "success");
      setStatutFilter("all");
      setPage(1);
      load();
    } catch {
      showToast("Impossible de créer la campagne.", "error");
    } finally {
      setSaving(false);
    }
  }

  const subtitle = loading
    ? undefined
    : `${data.count} campagne${data.count > 1 ? "s" : ""}${statutFilter !== "all" ? ` — filtre : ${STATUT_LABELS[statutFilter]}` : ""}`;

  return (
    <Layout pageTitle="Campagnes" pageSubtitle={subtitle} onNewCampaign={openModal}>
      <div className="camp-toolbar">
        <div className="search-wrap">
          <i className="ti ti-search" />
          <input
            type="text"
            placeholder="Rechercher un département…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-group">
          {STATUT_FILTERS.map((f) => (
            <button
              key={f.key}
              className={`filter-btn${statutFilter === f.key ? " active" : ""}`}
              onClick={() => handleFilterClick(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-wrap">
          <table aria-label="Liste des campagnes">
            <thead>
              <tr>
                <th>Département</th>
                <th>Statut</th>
                <th>Périmètre validé</th>
                <th>Créée le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--text3)", padding: 24 }}>
                    Chargement…
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--red)", padding: 24 }}>
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && visibleResults.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--text3)", padding: 24 }}>
                    Aucune campagne ne correspond à cette recherche.
                  </td>
                </tr>
              )}
              {!loading &&
                !error &&
                visibleResults.map((c) => {
                  const pillClasses = STATUT_PILL_CLASS[c.statut] || "s-draft dot-draft";
                  const [pillClass, dotClass] = pillClasses.split(" ");
                  return (
                    <tr key={c.id}>
                      <td className="td-name">{c.departement_display}</td>
                      <td>
                        <span className={`status-pill ${pillClass}`}>
                          <span className={`dot ${dotClass}`} /> {STATUT_LABELS[c.statut] || c.statut}
                        </span>
                      </td>
                      <td>
                        {c.perimetre_valide ? (
                          <span className="badge badge-success">Validé</span>
                        ) : (
                          <span className="badge badge-neutral">Non validé</span>
                        )}
                      </td>
                      <td style={{ color: "var(--text3)" }}>{formatDate(c.date_creation)}</td>
                      <td>
                        <div className="actions-cell">
                          {c.statut === "en_attente" && (
                            <div className="action-btn" onClick={() => handleLancer(c)} title="Lancer la campagne">
                              <i className="ti ti-send" style={{ fontSize: 15 }} />
                            </div>
                          )}
                          <div className="action-btn danger" onClick={() => handleSupprimer(c)} title="Supprimer">
                            <i className="ti ti-trash" style={{ fontSize: 15 }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 20px",
            borderTop: "1px solid var(--border)",
            fontSize: 12,
            color: "var(--text3)",
          }}
        >
          <span>
            {loading
              ? "Chargement…"
              : `${visibleResults.length} campagne${visibleResults.length > 1 ? "s" : ""} affichée${visibleResults.length > 1 ? "s" : ""} sur ${data.count}`}
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-sm" disabled={!data.previous} onClick={() => setPage((p) => p - 1)}>
              <i className="ti ti-chevron-left" />
            </button>
            <button
              className="btn btn-sm"
              style={{ background: "var(--navy-mid)", color: "#fff", borderColor: "var(--navy-mid)" }}
            >
              {page}
            </button>
            <button className="btn btn-sm" disabled={!data.next} onClick={() => setPage((p) => p + 1)}>
              <i className="ti ti-chevron-right" />
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Nouvelle campagne</h3>
              <div className="close-btn" role="button" tabIndex={0} onClick={() => setModalOpen(false)}>
                <i className="ti ti-x" />
              </div>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Département ciblé *</label>
                  <select
                    className="form-select"
                    value={formDepartement}
                    onChange={(e) => setFormDepartement(e.target.value)}
                  >
                    {Object.entries(DEPARTEMENT_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Statut initial</label>
                  <select className="form-select" value={formStatut} onChange={(e) => setFormStatut(e.target.value)}>
                    {Object.entries(STATUT_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="form-check">
                  <input
                    type="checkbox"
                    checked={formPerimetreValide}
                    onChange={(e) => setFormPerimetreValide(e.target.checked)}
                  />
                  Le périmètre de la campagne a déjà été validé
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setModalOpen(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Création…" : "Créer la campagne"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: "var(--navy)",
            color: "#fff",
            padding: "12px 18px",
            borderRadius: "var(--radius-lg)",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,.2)",
            zIndex: 999,
            maxWidth: 360,
          }}
        >
          <i className={`ti ${TOAST_ICONS[toast.type]}`} style={{ fontSize: 17, color: TOAST_COLORS[toast.type] }} />
          <span>{toast.message}</span>
        </div>
      )}
    </Layout>
  );
}
