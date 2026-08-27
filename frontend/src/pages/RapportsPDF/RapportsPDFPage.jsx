import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { deleteCampagne, listCampagnes } from "../../api/campagnes";
import { downloadRapportCampagne } from "../../api/rapports";
import { getScoreCampagne } from "../../api/scores";
import Layout from "../../components/Layout";
import ScoreRing from "../../components/ScoreRing";
import { useDepartements } from "../../context/DepartementsContext";
import { DEPARTEMENT_ICONS } from "../../utils/departements";
import { fillColorClass, pctColorClass } from "../../utils/score";
import { STATUT_LABELS } from "../../utils/statuts";

// Couleur distincte par statut pour repérer une campagne en attente au
// premier coup d'œil dans la liste des rapports (demande explicite de
// l'utilisateur, en attente = rouge).
const STATUT_BADGE_CLASS = {
  brouillon: "badge-neutral",
  en_attente: "badge-danger",
  active: "badge-warning",
  terminee: "badge-success",
};

const STATUT_FILTERS = [
  { key: "all", label: "Tous" },
  { key: "en_attente", label: "En attente" },
  { key: "active", label: "Active" },
  { key: "terminee", label: "Terminé" },
];

const TOAST_ICONS = { success: "ti-check", info: "ti-info-circle", error: "ti-alert-circle" };
const TOAST_COLORS = { success: "#4ADE80", info: "#60A5FA", error: "#F87171" };

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Déclenche le téléchargement d'un blob PDF sans passer par un lien serveur —
// aucun fichier de rapport n'est stocké, le PDF est régénéré à chaque appel
// à GET /api/campagnes/{id}/rapport/ (apps.rapports, jour 13).
function triggerDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default function RapportsPDFPage() {
  const { labelFor } = useDepartements();
  const [campagnes, setCampagnes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState("all");

  const [selectedId, setSelectedId] = useState(null);
  const [score, setScore] = useState(null);
  const [scoreLoading, setScoreLoading] = useState(false);

  const [generatingIds, setGeneratingIds] = useState(() => new Set());

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  function showToast(message, type = "info") {
    clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listCampagnes({})
      .then((data) => !cancelled && setCampagnes(data.results))
      .catch(() => !cancelled && setError("Impossible de charger les campagnes."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setScore(null);
      return;
    }
    let cancelled = false;
    setScoreLoading(true);
    getScoreCampagne(selectedId)
      .then((data) => !cancelled && setScore(data))
      .catch(() => !cancelled && setScore(null))
      .finally(() => !cancelled && setScoreLoading(false));
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const visibleCampagnes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return campagnes.filter((c) => {
      const matchesStatut = statutFilter === "all" || c.statut === statutFilter;
      const matchesSearch =
        !q || (c.departement_display || "").toLowerCase().includes(q) || String(c.id).includes(q);
      return matchesStatut && matchesSearch;
    });
  }, [campagnes, search, statutFilter]);

  const statutCounts = useMemo(() => {
    const counts = { all: campagnes.length, en_attente: 0, active: 0, terminee: 0 };
    campagnes.forEach((c) => {
      if (counts[c.statut] !== undefined) counts[c.statut] += 1;
    });
    return counts;
  }, [campagnes]);

  const selected = campagnes.find((c) => c.id === selectedId);

  const nbTerminees = useMemo(() => campagnes.filter((c) => c.statut === "terminee").length, [campagnes]);
  const nbActives = useMemo(() => campagnes.filter((c) => c.statut === "active").length, [campagnes]);
  const nbDepartements = useMemo(
    () => new Set(campagnes.map((c) => c.departement)).size,
    [campagnes]
  );

  const generate = useCallback(
    async (campagne) => {
      setGeneratingIds((prev) => new Set(prev).add(campagne.id));
      try {
        const blob = await downloadRapportCampagne(campagne.id);
        triggerDownload(blob, `rapport-campagne-${campagne.id}.pdf`);
        showToast(`Rapport téléchargé pour la campagne #${campagne.id}`, "success");
      } catch (err) {
        const status = err.response?.status;
        showToast(
          status === 403
            ? "Accès réservé aux rôles consultant et administrateur."
            : "Impossible de générer le rapport.",
          "error"
        );
      } finally {
        setGeneratingIds((prev) => {
          const next = new Set(prev);
          next.delete(campagne.id);
          return next;
        });
      }
    },
    []
  );

  const handleSupprimer = useCallback(
    async (campagne) => {
      if (
        !window.confirm(
          `Supprimer la campagne #${campagne.id} (${campagne.departement_display}) ? Son rapport ne sera plus disponible. Cette action est irréversible.`
        )
      ) {
        return;
      }
      try {
        await deleteCampagne(campagne.id);
        setCampagnes((prev) => prev.filter((c) => c.id !== campagne.id));
        setSelectedId((prev) => (prev === campagne.id ? null : prev));
        showToast(`Campagne #${campagne.id} supprimée.`, "success");
      } catch {
        showToast("Impossible de supprimer cette campagne.", "error");
      }
    },
    []
  );

  return (
    <Layout pageTitle="Rapports PDF" pageSubtitle={loading ? undefined : `${campagnes.length} campagne${campagnes.length > 1 ? "s" : ""} disponible${campagnes.length > 1 ? "s" : ""} pour un rapport`}>
      {loading && <p style={{ color: "var(--text3)", padding: "40px 0", textAlign: "center" }}>Chargement…</p>}
      {!loading && error && <p style={{ color: "var(--red)", padding: "40px 0", textAlign: "center" }}>{error}</p>}

      {!loading && !error && (
        <>
          <div className="metrics">
            <div className="metric m-navy">
              <div className="metric-label">
                <i className="ti ti-send" /> Campagnes
              </div>
              <div className="metric-value">{campagnes.length}</div>
              <div className="metric-sub">un rapport peut être généré pour chacune</div>
            </div>
            <div className="metric m-green">
              <div className="metric-label">
                <i className="ti ti-circle-check" /> Terminées
              </div>
              <div className="metric-value" style={{ color: "var(--green)" }}>{nbTerminees}</div>
            </div>
            <div className="metric m-orange">
              <div className="metric-label">
                <i className="ti ti-bolt" /> Actives
              </div>
              <div className="metric-value" style={{ color: "var(--orange)" }}>{nbActives}</div>
            </div>
            <div className="metric m-navy">
              <div className="metric-label">
                <i className="ti ti-building" /> Départements couverts
              </div>
              <div className="metric-value">{nbDepartements}</div>
            </div>
          </div>

          <div className="camp-toolbar">
            <div className="search-wrap">
              <i className="ti ti-search" />
              <input
                type="text"
                placeholder="Rechercher un département ou un numéro de campagne…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="filter-group">
              {STATUT_FILTERS.map((f) => (
                <button
                  key={f.key}
                  className={`filter-btn${statutFilter === f.key ? " active" : ""}`}
                  onClick={() => setStatutFilter(f.key)}
                >
                  {f.label} ({statutCounts[f.key] || 0})
                </button>
              ))}
            </div>
          </div>

          <div className="reports-layout">
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div
                style={{
                  padding: "14px 18px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600 }}>Campagnes</div>
                <span style={{ fontSize: 12, color: "var(--text3)" }}>
                  {visibleCampagnes.length} résultat{visibleCampagnes.length > 1 ? "s" : ""}
                </span>
              </div>

              {visibleCampagnes.length === 0 ? (
                <p style={{ color: "var(--text3)", textAlign: "center", padding: 32 }}>Aucune campagne trouvée.</p>
              ) : (
                <div>
                  {visibleCampagnes.map((c) => {
                    const isGenerating = generatingIds.has(c.id);
                    const badgeClass = STATUT_BADGE_CLASS[c.statut] || "badge-neutral";
                    return (
                      <div
                        key={c.id}
                        className={`rapport-row${selectedId === c.id ? " selected" : ""}`}
                        onClick={() => setSelectedId(c.id)}
                      >
                        <div className="rapport-icon">
                          <i className={`ti ${DEPARTEMENT_ICONS[c.departement] || "ti-building"}`} />
                          <span className="pdf-badge">PDF</span>
                        </div>
                        <div className="rapport-info">
                          <div className="rapport-name">
                            Campagne #{c.id} — {c.departement_display || labelFor(c.departement)}
                          </div>
                          <div className="rapport-meta">
                            <span>
                              <i className="ti ti-calendar" /> {formatDate(c.date_creation)}
                            </span>
                            <span className={`badge ${badgeClass}`}>{STATUT_LABELS[c.statut] || c.statut}</span>
                          </div>
                        </div>
                        <div className="rapport-actions">
                          <button
                            className="action-btn"
                            title="Télécharger le rapport PDF"
                            disabled={isGenerating}
                            onClick={(e) => {
                              e.stopPropagation();
                              generate(c);
                            }}
                          >
                            <i className={isGenerating ? "ti ti-loader-2" : "ti ti-download"} />
                          </button>
                          <button
                            className="action-btn danger"
                            title="Supprimer la campagne"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSupprimer(c);
                            }}
                          >
                            <i className="ti ti-trash" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="preview-sticky">
              {!selected && (
                <div className="preview-card">
                  <div className="preview-placeholder">
                    <div className="placeholder-icon">
                      <i className="ti ti-file-report" />
                    </div>
                    <div className="placeholder-title">Aperçu du rapport</div>
                    <div className="placeholder-sub">
                      Cliquez sur une campagne dans la liste pour afficher un aperçu de son rapport avant de le
                      télécharger.
                    </div>
                  </div>
                </div>
              )}

              {selected && (
                <div className="preview-card">
                  <div className="preview-header">
                    <div className="preview-header-left">
                      <i className="ti ti-file-report" />
                      <div>
                        <div className="preview-title">
                          Campagne #{selected.id} — {selected.departement_display || labelFor(selected.departement)}
                        </div>
                        <div className="preview-sub">{STATUT_LABELS[selected.statut] || selected.statut}</div>
                      </div>
                    </div>
                    <span className="preview-badge">PDF à la demande</span>
                  </div>

                  <div className="preview-body">
                    {scoreLoading && <p style={{ color: "var(--text3)", textAlign: "center", padding: 24 }}>Chargement…</p>}

                    {!scoreLoading && !score && (
                      <p style={{ color: "var(--red)", textAlign: "center", padding: 24 }}>
                        Impossible de charger le score de cette campagne.
                      </p>
                    )}

                    {!scoreLoading && score && (
                      <>
                        <div className="progress-ring-wrap" style={{ padding: "4px 0 16px" }}>
                          <ScoreRing score={score.score_vulnerabilite} size={110} />
                        </div>

                        <div className="bar-list" style={{ marginBottom: 16 }}>
                          <div className="bar-row">
                            <div className="bar-top">
                              <span>Taux d'ouverture</span>
                              <span className={`pct ${pctColorClass(score.taux_ouverture)}`}>{score.taux_ouverture} %</span>
                            </div>
                            <div className="bar-track">
                              <div className={`bar-fill ${fillColorClass(score.taux_ouverture)}`} style={{ width: `${score.taux_ouverture}%` }} />
                            </div>
                          </div>
                          <div className="bar-row">
                            <div className="bar-top">
                              <span>Taux de clic</span>
                              <span className={`pct ${pctColorClass(score.taux_clic)}`}>{score.taux_clic} %</span>
                            </div>
                            <div className="bar-track">
                              <div className={`bar-fill ${fillColorClass(score.taux_clic)}`} style={{ width: `${score.taux_clic}%` }} />
                            </div>
                          </div>
                          <div className="bar-row">
                            <div className="bar-top">
                              <span>Taux de soumission</span>
                              <span className={`pct ${pctColorClass(score.taux_soumission)}`}>{score.taux_soumission} %</span>
                            </div>
                            <div className="bar-track">
                              <div className={`bar-fill ${fillColorClass(score.taux_soumission)}`} style={{ width: `${score.taux_soumission}%` }} />
                            </div>
                          </div>
                          <div className="bar-row">
                            <div className="bar-top">
                              <span>Taux de signalement</span>
                              <span className="pct pct-ok">{score.taux_signalement} %</span>
                            </div>
                            <div className="bar-track">
                              <div className="bar-fill fill-success" style={{ width: `${score.taux_signalement}%` }} />
                            </div>
                          </div>
                        </div>

                        <p style={{ fontSize: 11.5, color: "var(--text3)", lineHeight: 1.6, marginBottom: 16 }}>
                          {score.total_envois === 0
                            ? "Aucun email n'a encore été envoyé pour cette campagne — le PDF le précisera avec des recommandations pour démarrer."
                            : "Le PDF généré reprend ces indicateurs, un score de vulnérabilité détaillé et des recommandations personnalisées pour ce département."}
                        </p>
                      </>
                    )}
                  </div>

                  <div className="preview-actions">
                    <button
                      className="btn btn-primary"
                      disabled={generatingIds.has(selected.id)}
                      onClick={() => generate(selected)}
                    >
                      <i className={generatingIds.has(selected.id) ? "ti ti-loader-2" : "ti ti-download"} />{" "}
                      {generatingIds.has(selected.id) ? "Génération en cours…" : "Télécharger le PDF"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
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
