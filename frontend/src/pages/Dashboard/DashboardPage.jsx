import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { logout } from "../../api/auth";
import { listCampagnes } from "../../api/campagnes";
import { getScoreParDepartement } from "../../api/scores";
import Layout from "../../components/Layout";
import ScoreRing from "../../components/ScoreRing";
import { useAuth } from "../../context/AuthContext";
import { computeGlobalStats, fillColorClass, metricAccentClass, pctColorClass, scoreColor } from "../../utils/score";
import { STATUT_LABELS } from "../../utils/statuts";

const STATUT_PILL_CLASS = {
  brouillon: "s-draft dot-draft",
  en_attente: "s-pending dot-pending",
  active: "s-active dot-active",
  terminee: "s-done dot-done",
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function DashboardPage() {
  const { refresh } = useAuth();
  const navigate = useNavigate();

  const [campagnes, setCampagnes] = useState({ count: 0, results: [] });
  const [deptScores, setDeptScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([listCampagnes({}), getScoreParDepartement()])
      .then(([campagnesData, deptData]) => {
        if (cancelled) return;
        setCampagnes(campagnesData);
        setDeptScores(deptData);
      })
      .catch(() => !cancelled && setError("Impossible de charger les indicateurs du tableau de bord."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  function handleLogout() {
    logout();
    refresh();
    navigate("/login", { replace: true });
  }

  const global = computeGlobalStats(deptScores);
  const deptsTestes = deptScores.filter((d) => d.total_envois > 0);
  const deptsTries = [...deptScores].sort((a, b) => b.taux_clic - a.taux_clic);
  const campagnesActives = campagnes.results.filter((c) => c.statut === "active").length;
  const deptAlerte = [...deptsTestes].sort((a, b) => b.score_vulnerabilite - a.score_vulnerabilite)[0];
  const recentes = campagnes.results.slice(0, 5);

  const subtitle = loading
    ? undefined
    : `${campagnes.count} campagne${campagnes.count > 1 ? "s" : ""} · ${global.totalEnvois} email${global.totalEnvois > 1 ? "s" : ""} envoyé${global.totalEnvois > 1 ? "s" : ""}`;

  return (
    <Layout
      pageTitle="Tableau de bord"
      pageSubtitle={subtitle}
      actions={
        <button className="btn" onClick={handleLogout}>
          <i className="ti ti-logout" /> Se déconnecter
        </button>
      }
    >
      {loading && <p style={{ color: "var(--text3)", padding: "40px 0", textAlign: "center" }}>Chargement…</p>}
      {!loading && error && <p style={{ color: "var(--red)", padding: "40px 0", textAlign: "center" }}>{error}</p>}

      {!loading && !error && (
        <>
          {deptAlerte && deptAlerte.score_vulnerabilite >= 50 && (
            <div className="alert-strip" role="alert">
              <i className="ti ti-alert-triangle" aria-hidden="true" />
              <span>
                <strong>Alerte risque élevé</strong> — {deptAlerte.departement_libelle} : score de vulnérabilité à{" "}
                {deptAlerte.score_vulnerabilite}/100. Formation urgente recommandée pour ce département.
              </span>
            </div>
          )}

          <div className="metrics">
            <div className="metric m-navy">
              <div className="metric-label">
                <i className="ti ti-send" /> Campagnes actives
              </div>
              <div className="metric-value">{campagnesActives}</div>
              <div className="metric-sub">sur {campagnes.count} au total</div>
            </div>
            <div className="metric m-navy">
              <div className="metric-label">
                <i className="ti ti-mail" /> Emails envoyés
              </div>
              <div className="metric-value">{global.totalEnvois}</div>
              <div className="metric-sub">
                {deptsTestes.length} département{deptsTestes.length > 1 ? "s" : ""} testé{deptsTestes.length > 1 ? "s" : ""}
              </div>
            </div>
            <div className={`metric ${metricAccentClass(global.tauxClic)}`}>
              <div className="metric-label">
                <i className="ti ti-pointer" /> Taux de clic moyen
              </div>
              <div className="metric-value" style={{ color: scoreColor(global.tauxClic) }}>
                {global.tauxClic} %
              </div>
              <div className="metric-sub">
                sur {global.totalEnvois} email{global.totalEnvois > 1 ? "s" : ""} testé{global.totalEnvois > 1 ? "s" : ""}
              </div>
            </div>
            <div className={`metric ${metricAccentClass(global.score)}`}>
              <div className="metric-label">
                <i className="ti ti-shield-exclamation" /> Score de vulnérabilité
              </div>
              <div className="metric-value" style={{ color: scoreColor(global.score) }}>
                {global.score} / 100
              </div>
              <div className="metric-sub">toutes campagnes confondues</div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Vulnérabilité par département</div>
                  <div className="card-sub">Taux de clic — {global.totalEnvois} email{global.totalEnvois > 1 ? "s" : ""} envoyés</div>
                </div>
              </div>
              <div className="bar-list">
                {deptsTries.map((d) => (
                  <div className="bar-row" key={d.departement}>
                    <div className="bar-top">
                      <span>{d.departement_libelle}</span>
                      {d.total_envois > 0 ? (
                        <span className={`pct ${pctColorClass(d.taux_clic)}`}>{d.taux_clic} %</span>
                      ) : (
                        <span style={{ color: "var(--text3)" }}>Aucun test</span>
                      )}
                    </div>
                    <div className="bar-track">
                      <div className={`bar-fill ${fillColorClass(d.taux_clic)}`} style={{ width: `${d.taux_clic}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Score global de vulnérabilité</div>
                  <div className="card-sub">Indice composite — toutes campagnes</div>
                </div>
              </div>
              <div className="progress-ring-wrap">
                <ScoreRing score={global.score} />
                <div className="ring-info">
                  <div className="ring-stat">
                    <div className="ring-stat-val" style={{ color: "var(--red)" }}>
                      {global.tauxClic} %
                    </div>
                    <div className="ring-stat-lbl">Taux de clic</div>
                  </div>
                  <div className="ring-stat">
                    <div className="ring-stat-val" style={{ color: "var(--orange)" }}>
                      {global.tauxSoumission} %
                    </div>
                    <div className="ring-stat-lbl">Taux de soumission</div>
                  </div>
                  <div className="ring-stat">
                    <div className="ring-stat-val" style={{ color: "var(--green)" }}>
                      {global.tauxSignalement} %
                    </div>
                    <div className="ring-stat-lbl">Taux de signalement</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "18px 20px 0" }} className="card-header">
              <div>
                <div className="card-title">Campagnes récentes</div>
                <div className="card-sub">{campagnes.count} campagne{campagnes.count > 1 ? "s" : ""} au total</div>
              </div>
              <a
                href="#"
                className="link"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/campagnes");
                }}
              >
                Voir toutes →
              </a>
            </div>
            <div className="table-wrap">
              <table aria-label="Campagnes récentes">
                <thead>
                  <tr>
                    <th>Département</th>
                    <th>Statut</th>
                    <th>Périmètre validé</th>
                    <th>Créée le</th>
                  </tr>
                </thead>
                <tbody>
                  {recentes.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", color: "var(--text3)", padding: 24 }}>
                        Aucune campagne pour le moment.
                      </td>
                    </tr>
                  )}
                  {recentes.map((c) => {
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
