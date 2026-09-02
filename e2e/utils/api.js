// Petites aides HTTP directes (hors navigateur) pour préparer et nettoyer
// les données nécessaires au parcours critique — l'annuaire des employés,
// vide par défaut dans cet environnement (voir docs/CONTEXTE_PROJET.md,
// « Prochaine action précise »), doit contenir au moins un employé du
// département testé pour que le lancement de campagne soit possible.
// N'utilise jamais le navigateur : plus rapide et plus fiable qu'un
// parcours UI pour de la donnée de test qui n'est pas elle-même sous
// test ici (la création d'employé a son propre parcours, hors périmètre
// de ce test). `request` est une APIRequestContext Playwright, déjà liée
// à la baseURL configurée (playwright.config.js) — chemins relatifs.

export async function obtenirJeton(request, { email, password }) {
  const response = await request.post("/api/auth/login/", {
    data: { email, password },
  });
  if (!response.ok()) {
    throw new Error(`Connexion API échouée pour ${email} : ${response.status()} ${await response.text()}`);
  }
  const data = await response.json();
  return data.access;
}

export async function creerEmployeDeTest(request, jetonAdmin, { nom, email, departement }) {
  const response = await request.post("/api/employes/", {
    headers: { Authorization: `Bearer ${jetonAdmin}` },
    data: { nom, email, departement },
  });
  if (!response.ok()) {
    throw new Error(`Création de l'employé de test échouée : ${response.status()} ${await response.text()}`);
  }
  return response.json();
}

export async function supprimerEmploye(request, jetonAdmin, employeId) {
  if (!employeId) return;
  await request.delete(`/api/employes/${employeId}/`, {
    headers: { Authorization: `Bearer ${jetonAdmin}` },
  });
}

export async function supprimerCampagne(request, jetonAdmin, campagneId) {
  if (!campagneId) return;
  await request.delete(`/api/campagnes/${campagneId}/`, {
    headers: { Authorization: `Bearer ${jetonAdmin}` },
  });
}
