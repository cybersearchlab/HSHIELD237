import { useEffect, useMemo, useState } from "react";

import { getHistoriqueParDepartement } from "../../api/historique";
import { downloadRapportCampagne } from "../../api/rapports";
import Layout from "../../components/Layout";
import { DEPARTEMENT_ICONS } from "../../utils/departements";
import { fillColorClass, pctColorClass, scoreColor } from "../../utils/score";
import { STATUT_LABELS } from "../../utils/statuts";

const STATUT_FILTERS = [
  { key: "all", label: "Tout" },
  { key: "terminee", label: "Terminées" },
  { key: "active", label: "Actives" },
  { key: "en_attente", label: "En attente" },
];

const STATUT_DOT = {
  brouillon: { color: "var(--text3)", icon: "ti-file" },
  en_attente: { color: "var(--orange)", icon: "ti-clock" },
  active: { color: "var(--navy-mid)", icon: "ti-send" },
  terminee: { color: "var(--green)", icon: "ti-circle-check" },
};

const MOIS_LABELS = {};

function moisLabel(iso) {
  const d = new Date(iso);
  const key = `${d.getFullYear()}-${d.getMonth()}`;
  if (!MOIS_LABELS[key]) {
    const label = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    MOIS_LABELS[key] = label.charAt(0).toUpperCase() + label.slice(1);
  }
  return { key, label: MOIS_LABELS[key], sortKey: d.getFullYear() * 12 + d.getMonth() };
}

function formatDateTime(iso) {
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

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

export default function HistoriquePage() {
  const [donnees, setDonnees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getHistoriqueParDepartement()
      .then((data) => !cancelled && setDonnees(data))
      .catch(() => !cancelled && setError("Impossible de charger l'historique."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const toutesCampagnes = useMemo(() => {
    const items = [];
    donnees.forEach((d) => {
      d.campagnes.forEach((c) => {
        items.push({ ...c, departement: d.departement, departement_libelle: d.departement_libelle });
      });
    });
    items.sort((a, b) => new Date(b.date_creation) - new Date(a.date_creation));
    return items;
  }, [donnees]);

  const globalStats = useMemo(() => {
    const testees = toutesCampagnes.filter((c) => c.total_envois > 0);
    const totalEnvois = toutesCampagnes.reduce((sum, c) => sum + c.total_envois, 0);
    if (totalEnvois === 0) {
      return { totalCampagnes: toutesCampagnes.length, totalEnvois: 0, tauxClicMoyen: 0, tauxSignalementMoyen: 0 };
    }
    const weighted = (key) =>
      Math.round((testees.reduce((sum, c) => sum + c[key] * c.total_envois, 0) / totalEnvois) * 10) / 10;
    return {
      totalCampagnes: toutesCampagnes.length,
      totalEnvois,
      tauxClicMoyen: weighted("taux_clic"),
      tauxSignalementMoyen: weighted("taux_signalement"),
    };
  }, [toutesCampagnes]);

  const evolutionMensuelle = useMemo(() => {
    const parMois = {};
    toutesCampagnes
      .filter((c) => c.total_envois > 0)
      .forEach((c) => {
        const { key, label, sortKey } = moisLabel(c.date_creation);
        if (!parMois[key]) parMois[key] = { label, sortKey, total: 0, count: 0 };
        parMois[key].total += c.score_vulnerabilite;
        parMois[key].count += 1;
      });
    return Object.values(parMois)
      .map((m) => ({ label: m.label, score: Math.round((m.total / m.count) * 10) / 10 }))
      .sort((a, b) => a.sortKey - b.sortKey)
      .slice(-7);
  }, [toutesCampagnes]);

  const visibleGroupes = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = toutesCampagnes.filter((c) => {
      const matchesStatut = statutFilter === "all" || c.statut === statutFilter;
      const matchesSearch =
        !q || c.departement_libelle.toLowerCase().includes(q) || String(c.campagne_id).includes(q);
      return matchesStatut && matchesSearch;
    });
    const groupes = {};
    filtered.forEach((c) => {
      const { key, label, sortKey } = moisLabel(c.date_creation);
      if (!groupes[key]) groupes[key] = { label, sortKey, items: [] };
      groupes[key].items.push(c);
    });
    return Object.values(groupes).sort((a, b) => b.sortKey - a.sortKey);
  }, [toutesCampagnes, search, statutFilter]);

  const selected = toutesCampagnes.find((c) => c.campagne_id === selectedId);

  async function handleTelecharger(campagneId) {
    setDownloadingId(campagneId);
    try {
      const blob = await downloadRapportCampagne(campagneId);
      triggerDownload(blob, `rapport-campagne-${campagneId}.pdf`);
    } catch {
      // Le bouton indique déjà l'échec en cessant de tourner ; pas de toast
      // dédié sur cette page pour rester simple, cohérent avec son rôle de
      // consultation plutôt que d'action.
    } finally {
      setDownloadingId(null);
    }
  }

  const maxEvolution = Math.max(1, ...evolutionMensuelle.map((m) => m.score));

  return (
    <Layout
      pageTitle="Historique"
      pageSubtitle={loading ? undefined : `${globalStats.totalCampagnes} campagne${globalStats.totalCampagnes > 1 ? "s" : ""} au total`}
    >
      {loading && <p style={{ color: "var(--text3)", padding: "40px 0", textAlign: "center" }}>Chargement…</p>}
      {!loading && error && <p style={{ color: "var(--red)", padding: "40px 0", textAlign: "center" }}>{error}</p>}

      {!loading && !error && (
        <>
          <div className="metrics">
            <div className="metric m-navy">
              <div className="metric-label">
                <i className="ti ti-calendar" /> Campagnes totales
              </div>
              <div className="metric-value">{globalStats.totalCampagnes}</div>
            </div>
            <div className="metric m-navy">
              <div className="metric-label">
                <i className="ti ti-mail" /> Emails envoyés
              </div>
              <div className="metric-value">{globalStats.totalEnvois}</div>
            </div>
            <div className="metric m-orange">
              <div className="metric-label">
                <i className="ti ti-pointer" /> Taux de clic moyen
              </div>
              <div className="metric-value" style={{ color: scoreColor(globalStats.tauxClicMoyen) }}>
                {globalStats.tauxClicMoyen} %
              </div>
            </div>
            <div className="metric m-green">
              <div className="metric-label">
                <i className="ti ti-flag" /> Taux de signalement moyen
              </div>
              <div className="metric-value" style={{ color: "var(--green)" }}>
                {globalStats.tauxSignalementMoyen} %
              </div>
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
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="hist-layout">
            <div>
              {visibleGroupes.length === 0 ? (
                <div className="card" style={{ textAlign: "center", color: "var(--text3)", padding: 40 }}>
                  Aucune campagne trouvée pour ces critères.
                </div>
              ) : (
                visibleGroupes.map((groupe) => (
                  <div className="timeline-month" key={groupe.label}>
                    <div className="month-label">{groupe.label}</div>
                    {groupe.items.map((c, i) => {
                      const dot = STATUT_DOT[c.statut] || STATUT_DOT.brouillon;
                      return (
                        <div className="tl-item" key={c.campagne_id}>
                          <div className="tl-line">
                            <div className="tl-dot" style={{ background: dot.color }}>
                              <i className={`ti ${dot.icon}`} />
                            </div>
                            {i < groupe.items.length - 1 && <div className="tl-connector" />}
                          </div>
                          <div
                            className={`tl-card${selectedId === c.campagne_id ? " selected" : ""}`}
                            onClick={() => setSelectedId(c.campagne_id)}
                          >
                            <div className="tl-card-top">
                              <div className="tl-card-left">
                                <div className="tl-card-title">
                                  <i
                                    className={`ti ${DEPARTEMENT_ICONS[c.departement] || "ti-building"}`}
                                    style={{ color: "var(--text3)", marginRight: 5 }}
                                  />
                                  {c.departement_libelle}
                                </div>
                                <div className="tl-card-sub">Campagne #{c.campagne_id}</div>
                              </div>
                              <div className="tl-card-right">
                                <div className="tl-date">{formatDateTime(c.date_creation)}</div>
                                <span className={`badge ${c.statut === "terminee" ? "badge-success" : c.statut === "active" ? "badge-accent" : c.statut === "en_attente" ? "badge-warning" : "badge-neutral"}`}>
                                  {STATUT_LABELS[c.statut] || c.statut}
                                </span>
                              </div>
                            </div>
                            <div className="tl-metrics">
                              <div className="tl-metric">
                                <span className="tl-metric-val" style={{ color: c.total_envois ? scoreColor(c.taux_clic) : "var(--text3)" }}>
                                  {c.total_envois ? `${c.taux_clic} %` : "—"}
                                </span>
                                <span className="tl-metric-lbl">clic</span>
                              </div>
                              <div className="tl-metric">
                                <span className="tl-metric-val">{c.total_envois}</span>
                                <span className="tl-metric-lbl">dest.</span>
                              </div>
                              <div className="tl-metric">
                                <span className="tl-metric-val" style={{ color: "var(--green)" }}>
                                  {c.total_envois ? `${c.taux_signalement} %` : "—"}
                                </span>
                                <span className="tl-metric-lbl">signal.</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            <div>
              {evolutionMensuelle.length > 0 && (
                <div className="card card-pad evo-card">
                  <div className="card-header">
                    <div>
                      <div className="card-title">Évolution mensuelle</div>
                      <div className="card-sub">Score de vulnérabilité moyen des campagnes testées</div>
                    </div>
                  </div>
                  <div className="mini-bar-chart">
                    {evolutionMensuelle.map((m) => (
                      <div className="mbc-col" key={m.label}>
                        <div className="mbc-val">{m.score}</div>
                        <div
                          className="mbc-bar"
                          style={{ height: `${(m.score / maxEvolution) * 100}%`, background: scoreColor(m.score) }}
                        />
                        <div className="mbc-lbl">{m.label.split(" ")[0].slice(0, 3)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="detail-panel">
                {!selected && (
                  <div className="detail-empty">
                    <div className="detail-empty-icon">
                      <i className="ti ti-timeline" />
                    </div>
                    <div className="detail-empty-title">Détail de la campagne</div>
                    <div className="detail-empty-sub">
                      Cliquez sur une campagne dans la liste pour afficher son détail ici.
                    </div>
                  </div>
                )}

                {selected && (
                  <>
                    <div className="detail-header">
                      <div>
                        <div className="detail-header-title">{selected.departement_libelle}</div>
                        <div className="detail-header-sub">
                          Campagne #{selected.campagne_id} · {formatDateTime(selected.date_creation)}
                        </div>
                      </div>
                      <span className="badge badge-accent">{STATUT_LABELS[selected.statut] || selected.statut}</span>
                    </div>
                    <div className="detail-body">
                      <div>
                        <div className="d-section-title">Résultats clés</div>
                        <div className="d-info-grid">
                          <div className="d-info-item">
                            <div className="d-info-label">Destinataires</div>
                            <div className="d-info-val">{selected.total_envois}</div>
                          </div>
                          <div className="d-info-item">
                            <div className="d-info-label">Score</div>
                            <div className="d-info-val" style={{ color: scoreColor(selected.score_vulnerabilite) }}>
                              {selected.score_vulnerabilite} / 100
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="d-section-title">Comportements</div>
                        <div className="bar-list">
                          {[
                            ["Ouverture", selected.taux_ouverture],
                            ["Clic", selected.taux_clic],
                            ["Soumission", selected.taux_soumission],
                          ].map(([label, value]) => (
                            <div className="bar-row" key={label}>
                              <div className="bar-top">
                                <span>{label}</span>
                                <span className={`pct ${pctColorClass(value)}`}>{value} %</span>
                              </div>
                              <div className="bar-track">
                                <div className={`bar-fill ${fillColorClass(value)}`} style={{ width: `${value}%` }} />
                              </div>
                            </div>
                          ))}
                          <div className="bar-row">
                            <div className="bar-top">
                              <span>Signalement</span>
                              <span className="pct pct-ok">{selected.taux_signalement} %</span>
                            </div>
                            <div className="bar-track">
                              <div className="bar-fill fill-success" style={{ width: `${selected.taux_signalement}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="detail-footer">
                      <button
                        className="btn btn-primary"
                        disabled={downloadingId === selected.campagne_id}
                        onClick={() => handleTelecharger(selected.campagne_id)}
                      >
                        <i className={downloadingId === selected.campagne_id ? "ti ti-loader-2" : "ti ti-file-report"} />{" "}
                        {downloadingId === selected.campagne_id ? "Génération…" : "Rapport PDF"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
