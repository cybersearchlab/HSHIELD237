import { useEffect, useMemo, useState } from "react";

import { listCampagnes } from "../../api/campagnes";
import { getScoreCampagne, getScoreParDepartement } from "../../api/scores";
import Layout from "../../components/Layout";
import ScoreRing from "../../components/ScoreRing";
import { DEPARTEMENT_ICONS } from "../../utils/departements";
import {
  computeGlobalStats,
  fillColorClass,
  metricAccentClass,
  pctColorClass,
  riskChipClass,
  riskLabel,
  scoreColor,
} from "../../utils/score";
import { STATUT_LABELS } from "../../utils/statuts";

const TABS = [
  { key: "global", label: "Vue globale" },
  { key: "departements", label: "Par département" },
];

export default function ResultatsPage() {
  const [campagnes, setCampagnes] = useState([]);
  const [deptScores, setDeptScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedCampagneId, setSelectedCampagneId] = useState("all");
  const [campagneScore, setCampagneScore] = useState(null);
  const [campagneScoreLoading, setCampagneScoreLoading] = useState(false);

  const [tab, setTab] = useState("global");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([listCampagnes({}), getScoreParDepartement()])
      .then(([campagnesData, deptData]) => {
        if (cancelled) return;
        setCampagnes(campagnesData.results);
        setDeptScores(deptData);
      })
      .catch(() => !cancelled && setError("Impossible de charger les résultats."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selectedCampagneId === "all") {
      setCampagneScore(null);
      return;
    }
    let cancelled = false;
    setCampagneScoreLoading(true);
    getScoreCampagne(selectedCampagneId)
      .then((data) => !cancelled && setCampagneScore(data))
      .catch(() => !cancelled && setCampagneScore(null))
      .finally(() => !cancelled && setCampagneScoreLoading(false));
    return () => {
      cancelled = true;
    };
  }, [selectedCampagneId]);

  const global = useMemo(() => computeGlobalStats(deptScores), [deptScores]);
  const deptsTries = useMemo(
    () => [...deptScores].sort((a, b) => b.score_vulnerabilite - a.score_vulnerabilite),
    [deptScores]
  );
  const deptsTestes = useMemo(() => deptsTries.filter((d) => d.total_envois > 0), [deptsTries]);

  const selectedCampagne = campagnes.find((c) => String(c.id) === String(selectedCampagneId));

  const subtitle = loading
    ? undefined
    : selectedCampagneId === "all"
    ? `Vue agrégée — ${campagnes.length} campagne${campagnes.length > 1 ? "s" : ""} · ${global.totalEnvois} email${global.totalEnvois > 1 ? "s" : ""} testé${global.totalEnvois > 1 ? "s" : ""}`
    : `Campagne #${selectedCampagneId} — ${selectedCampagne?.departement_display || ""}`;

  return (
    <Layout pageTitle="Résultats & Analyses" pageSubtitle={subtitle}>
      {loading && <p style={{ color: "var(--text3)", padding: "40px 0", textAlign: "center" }}>Chargement…</p>}
      {!loading && error && <p style={{ color: "var(--red)", padding: "40px 0", textAlign: "center" }}>{error}</p>}

      {!loading && !error && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "var(--text3)" }}>Campagne :</span>
            <select
              className="form-select"
              style={{ maxWidth: 360, marginBottom: 0 }}
              value={selectedCampagneId}
              onChange={(e) => setSelectedCampagneId(e.target.value)}
            >
              <option value="all">Toutes les campagnes — agrégé par département</option>
              {campagnes.map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.id} — {c.departement_display} ({STATUT_LABELS[c.statut] || c.statut})
                </option>
              ))}
            </select>
          </div>

          {selectedCampagneId === "all" && (
            <>
              <div className="metrics">
                <div className="metric m-navy">
                  <div className="metric-label">
                    <i className="ti ti-mail" /> Emails envoyés
                  </div>
                  <div className="metric-value">{global.totalEnvois}</div>
                  <div className="metric-sub">toutes campagnes confondues</div>
                </div>
                <div className={`metric ${metricAccentClass(global.tauxClic)}`}>
                  <div className="metric-label">
                    <i className="ti ti-pointer" /> Taux de clic
                  </div>
                  <div className="metric-value" style={{ color: scoreColor(global.tauxClic) }}>
                    {global.tauxClic} %
                  </div>
                </div>
                <div className={`metric ${metricAccentClass(global.tauxSoumission)}`}>
                  <div className="metric-label">
                    <i className="ti ti-forms" /> Taux de soumission
                  </div>
                  <div className="metric-value" style={{ color: scoreColor(global.tauxSoumission) }}>
                    {global.tauxSoumission} %
                  </div>
                </div>
                <div className="metric m-green">
                  <div className="metric-label">
                    <i className="ti ti-flag" /> Taux de signalement
                  </div>
                  <div className="metric-value" style={{ color: "var(--green)" }}>
                    {global.tauxSignalement} %
                  </div>
                </div>
              </div>

              <div className="tabs">
                {TABS.map((t) => (
                  <div key={t.key} className={`tab${tab === t.key ? " active" : ""}`} onClick={() => setTab(t.key)}>
                    {t.label}
                  </div>
                ))}
              </div>

              {tab === "global" && (
                <>
                  <div className="grid-2">
                    <div className="card">
                      <div className="card-header">
                        <div>
                          <div className="card-title">Score de vulnérabilité global</div>
                          <div className="card-sub">Indice composite — toutes campagnes</div>
                        </div>
                      </div>
                      <div className="progress-ring-wrap">
                        <ScoreRing score={global.score} />
                        <div className="ring-info">
                          <div className="ring-stat">
                            <div className="ring-stat-val">
                              {deptsTestes.length} / {deptScores.length}
                            </div>
                            <div className="ring-stat-lbl">Départements testés</div>
                          </div>
                          <div className="ring-stat">
                            <div className="ring-stat-val">{global.totalEnvois}</div>
                            <div className="ring-stat-lbl">Emails envoyés</div>
                          </div>
                          <div className="ring-stat">
                            <div className="ring-stat-val">{campagnes.length}</div>
                            <div className="ring-stat-lbl">Campagnes réalisées</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="card">
                      <div className="card-header">
                        <div>
                          <div className="card-title">Comportements observés</div>
                          <div className="card-sub">Taux indépendants — un envoi peut cumuler plusieurs événements</div>
                        </div>
                      </div>
                      <div className="bar-list">
                        <div className="bar-row">
                          <div className="bar-top">
                            <span>Ouverture (pixel)</span>
                            <span className={`pct ${pctColorClass(global.tauxOuverture)}`}>{global.tauxOuverture} %</span>
                          </div>
                          <div className="bar-track">
                            <div className={`bar-fill ${fillColorClass(global.tauxOuverture)}`} style={{ width: `${global.tauxOuverture}%` }} />
                          </div>
                        </div>
                        <div className="bar-row">
                          <div className="bar-top">
                            <span>Clic sur le lien</span>
                            <span className={`pct ${pctColorClass(global.tauxClic)}`}>{global.tauxClic} %</span>
                          </div>
                          <div className="bar-track">
                            <div className={`bar-fill ${fillColorClass(global.tauxClic)}`} style={{ width: `${global.tauxClic}%` }} />
                          </div>
                        </div>
                        <div className="bar-row">
                          <div className="bar-top">
                            <span>Soumission du formulaire</span>
                            <span className={`pct ${pctColorClass(global.tauxSoumission)}`}>{global.tauxSoumission} %</span>
                          </div>
                          <div className="bar-track">
                            <div className={`bar-fill ${fillColorClass(global.tauxSoumission)}`} style={{ width: `${global.tauxSoumission}%` }} />
                          </div>
                        </div>
                        <div className="bar-row">
                          <div className="bar-top">
                            <span>Signalement</span>
                            <span className="pct pct-ok">{global.tauxSignalement} %</span>
                          </div>
                          <div className="bar-track">
                            <div className="bar-fill fill-success" style={{ width: `${global.tauxSignalement}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <div>
                        <div className="card-title">Classement des départements</div>
                        <div className="card-sub">Du plus au moins vulnérable — score composite</div>
                      </div>
                    </div>
                    {deptsTestes.length === 0 ? (
                      <p style={{ color: "var(--text3)", textAlign: "center", padding: 24 }}>
                        Aucun email envoyé pour le moment — le classement apparaîtra après le lancement d'une
                        première campagne.
                      </p>
                    ) : (
                      <div className="dept-rank">
                        {deptsTestes.map((d, i) => (
                          <div className="dept-item" key={d.departement}>
                            <div className="dept-rank-num" style={{ color: i === 0 ? "var(--red)" : "var(--text3)" }}>
                              {i + 1}
                            </div>
                            <div className="dept-icon" style={{ background: "var(--blue-light)" }}>
                              <i
                                className={`ti ${DEPARTEMENT_ICONS[d.departement] || "ti-building"}`}
                                style={{ color: "var(--blue)" }}
                              />
                            </div>
                            <div className="dept-name">{d.departement_libelle}</div>
                            <div className="dept-stats">
                              <div className="dept-pct" style={{ color: scoreColor(d.score_vulnerabilite) }}>
                                {d.score_vulnerabilite} / 100
                              </div>
                              <div className="dept-lbl">{riskLabel(d.score_vulnerabilite)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {tab === "departements" && (
                <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                  <div className="table-wrap">
                    <table aria-label="Détail par département">
                      <thead>
                        <tr>
                          <th>Département</th>
                          <th>Campagnes</th>
                          <th>Emails envoyés</th>
                          <th>Taux de clic</th>
                          <th>Taux de soumission</th>
                          <th>Taux de signalement</th>
                          <th>Score</th>
                          <th>Niveau de risque</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deptsTries.map((d) => (
                          <tr key={d.departement}>
                            <td className="td-name">
                              <i
                                className={`ti ${DEPARTEMENT_ICONS[d.departement] || "ti-building"}`}
                                style={{ color: "var(--text3)", marginRight: 6 }}
                              />
                              {d.departement_libelle}
                            </td>
                            <td>{d.nombre_campagnes}</td>
                            <td>{d.total_envois}</td>
                            <td style={d.total_envois ? { color: scoreColor(d.taux_clic), fontWeight: 700 } : { color: "var(--text3)" }}>
                              {d.total_envois ? `${d.taux_clic} %` : "—"}
                            </td>
                            <td style={d.total_envois ? { color: scoreColor(d.taux_soumission), fontWeight: 700 } : { color: "var(--text3)" }}>
                              {d.total_envois ? `${d.taux_soumission} %` : "—"}
                            </td>
                            <td>{d.total_envois ? `${d.taux_signalement} %` : "—"}</td>
                            <td style={{ fontWeight: 700 }}>{d.total_envois ? `${d.score_vulnerabilite} / 100` : "—"}</td>
                            <td>
                              {d.total_envois ? (
                                <span className={riskChipClass(d.score_vulnerabilite)}>
                                  <i className="ti ti-alert-triangle" style={{ fontSize: 11 }} /> {riskLabel(d.score_vulnerabilite)}
                                </span>
                              ) : (
                                <span className="badge badge-neutral">Non testé</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {selectedCampagneId !== "all" && (
            <div className="card">
              {campagneScoreLoading && (
                <p style={{ color: "var(--text3)", textAlign: "center", padding: 24 }}>Chargement…</p>
              )}
              {!campagneScoreLoading && !campagneScore && (
                <p style={{ color: "var(--red)", textAlign: "center", padding: 24 }}>
                  Impossible de charger le score de cette campagne.
                </p>
              )}
              {!campagneScoreLoading && campagneScore && (
                <>
                  <div className="card-header">
                    <div>
                      <div className="card-title">
                        Score — {selectedCampagne?.departement_display} (#{selectedCampagneId})
                      </div>
                      <div className="card-sub">
                        {campagneScore.nombre_scenarios} scénario{campagneScore.nombre_scenarios > 1 ? "s" : ""} ·{" "}
                        {campagneScore.total_envois} email{campagneScore.total_envois > 1 ? "s" : ""} envoyé
                        {campagneScore.total_envois > 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                  <div className="progress-ring-wrap">
                    <ScoreRing score={campagneScore.score_vulnerabilite} />
                    <div className="ring-info">
                      <div className="ring-stat">
                        <div className="ring-stat-val" style={{ color: "var(--blue)" }}>
                          {campagneScore.taux_ouverture} %
                        </div>
                        <div className="ring-stat-lbl">Taux d'ouverture</div>
                      </div>
                      <div className="ring-stat">
                        <div className="ring-stat-val" style={{ color: "var(--red)" }}>
                          {campagneScore.taux_clic} %
                        </div>
                        <div className="ring-stat-lbl">Taux de clic</div>
                      </div>
                      <div className="ring-stat">
                        <div className="ring-stat-val" style={{ color: "var(--orange)" }}>
                          {campagneScore.taux_soumission} %
                        </div>
                        <div className="ring-stat-lbl">Taux de soumission</div>
                      </div>
                      <div className="ring-stat">
                        <div className="ring-stat-val" style={{ color: "var(--green)" }}>
                          {campagneScore.taux_signalement} %
                        </div>
                        <div className="ring-stat-lbl">Taux de signalement</div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
