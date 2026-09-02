// Comptes de test utilisés par les parcours E2E — les mêmes que ceux
// documentés dans docs/CONTEXTE_PROJET.md (« Prochaine action précise »),
// déjà présents dans l'environnement Docker de développement via les
// migrations/fixtures existantes. Surchargeables par variable
// d'environnement pour cibler un autre environnement (voir README.md).
export const COMPTES = {
  consultant: {
    email: process.env.E2E_CONSULTANT_EMAIL || "consultant@hshield237.local",
    password: process.env.E2E_CONSULTANT_PASSWORD || "Consultant1234!",
  },
  administrateur: {
    email: process.env.E2E_ADMIN_EMAIL || "administrateur@hshield237.local",
    password: process.env.E2E_ADMIN_PASSWORD || "Administrateur1234!",
  },
  // Responsable désigné pour le département Informatique ("it") — voir
  // ResponsableDepartement en base. Utilisé pour valider le consentement
  // de la campagne créée par le parcours critique.
  responsableIT: {
    email: process.env.E2E_RESPONSABLE_EMAIL || "responsable@hshield237.local",
    password: process.env.E2E_RESPONSABLE_PASSWORD || "Responsable1234!",
  },
};

// Département utilisé par le parcours critique — choisi parce qu'un
// responsable y est déjà désigné (COMPTES.responsableIT), condition
// nécessaire pour qu'une demande de consentement soit générée
// automatiquement à la création de la campagne (voir
// apps.gouvernance.services.creer_consentement_auto).
export const DEPARTEMENT_TEST = { code: "it", nom: "Informatique" };
