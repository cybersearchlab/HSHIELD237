// Seuils du score de vulnérabilité composite (0-100), calculé côté backend
// (apps.campagnes.services.calculer_score) : >=50 élevé, >=25 modéré, sinon faible.
export function scoreColor(pct) {
  if (pct >= 50) return "var(--red)";
  if (pct >= 25) return "var(--orange)";
  return "var(--green)";
}

export function pctColorClass(pct) {
  if (pct >= 50) return "pct-danger";
  if (pct >= 25) return "pct-warning";
  return "pct-ok";
}

export function fillColorClass(pct) {
  if (pct >= 50) return "fill-danger";
  if (pct >= 25) return "fill-warning";
  return "fill-success";
}

export function metricAccentClass(pct) {
  if (pct >= 50) return "m-red";
  if (pct >= 25) return "m-orange";
  return "m-green";
}

export function riskLabel(pct) {
  if (pct >= 50) return "Élevé";
  if (pct >= 25) return "Modéré";
  return "Faible";
}

export function riskChipClass(pct) {
  if (pct >= 50) return "risk-chip risk-high";
  if (pct >= 25) return "risk-chip risk-mid";
  return "risk-chip risk-low";
}

// Agrège les scores par département (endpoint /api/campagnes/departements/score/)
// en une vue d'ensemble pondérée par le nombre réel d'emails envoyés — une
// simple moyenne des pourcentages fausserait le résultat en faveur des
// départements peu testés.
export function computeGlobalStats(deptScores) {
  const totalEnvois = deptScores.reduce((sum, d) => sum + d.total_envois, 0);
  if (totalEnvois === 0) {
    return { totalEnvois: 0, tauxOuverture: 0, tauxClic: 0, tauxSoumission: 0, tauxSignalement: 0, score: 0 };
  }
  const weighted = (key) =>
    Math.round((deptScores.reduce((sum, d) => sum + d[key] * d.total_envois, 0) / totalEnvois) * 10) / 10;
  return {
    totalEnvois,
    tauxOuverture: weighted("taux_ouverture"),
    tauxClic: weighted("taux_clic"),
    tauxSoumission: weighted("taux_soumission"),
    tauxSignalement: weighted("taux_signalement"),
    score: weighted("score_vulnerabilite"),
  };
}
