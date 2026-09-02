import { defineConfig, devices } from "@playwright/test";

// Ces tests s'exécutent contre l'environnement Docker complet déjà en
// cours d'exécution (docker compose up -d) — Playwright ne démarre rien
// lui-même (pas de `webServer`), volontairement : la pile à tester est
// l'assemblage réel des 4 services (db, backend, frontend, nginx), pas un
// serveur de développement isolé. Voir README.md de ce dossier.
const BASE_URL = process.env.E2E_BASE_URL || "https://localhost";

export default defineConfig({
  testDir: "./tests",
  timeout: 90_000,
  expect: {
    timeout: 15_000,
  },
  // Le parcours critique (parcours-critique.spec.js) est un unique
  // scénario métier séquentiel où deux rôles agissent tour à tour sur la
  // même campagne — jamais paralléliser à l'intérieur d'un fichier, ni
  // entre fichiers (une campagne de test à la fois évite toute
  // interférence entre exécutions concurrentes).
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: BASE_URL,
    // Certificat auto-signé de développement (nginx/certs/) — voir
    // docs/DEPLOIEMENT.md (à venir, Jour 19) pour un certificat réel en
    // production.
    ignoreHTTPSErrors: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
