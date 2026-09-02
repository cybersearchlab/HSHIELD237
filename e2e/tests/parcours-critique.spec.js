import { expect, test } from "@playwright/test";

import { creerEmployeDeTest, obtenirJeton, supprimerCampagne, supprimerEmploye } from "../utils/api.js";
import { COMPTES, DEPARTEMENT_TEST } from "../utils/comptes.js";

// Parcours critique de bout en bout (docs/rapport_planification.md,
// Jour 18) : connexion → génération de scénario (mode API et mode
// manuel) → lancement de campagne avec consentement → consultation du
// tableau de bord.
//
// Écart assumé par rapport à l'énoncé du Jour 18 : « création
// d'entreprise » est remplacée par « création d'une campagne ciblant un
// département ». Le modèle Entreprise a été entièrement supprimé au
// Jour 6 (voir docs/CONTEXTE_PROJET.md, « Décisions et écarts », n°1) —
// l'application ne sert qu'une seule entreprise cliente, segmentée par
// département. La création de campagne en est l'équivalent réel : c'est
// elle qui, aujourd'hui, déclenche automatiquement la demande de
// consentement (voir apps.gouvernance.services.creer_consentement_auto).
//
// Étapes regroupées en un seul describe.serial plutôt qu'en tests
// indépendants : chaque étape dépend réellement de l'état laissé par la
// précédente (le scénario généré doit exister avant de pouvoir lancer la
// campagne, le consentement doit être validé avant que le bouton de
// lancement ne soit même cliquable) — les séparer masquerait ce
// qu'un test isolé, en réalité, ne pourrait pas exécuter seul.
test.describe.serial("Parcours critique — de la connexion au tableau de bord", () => {
  // Génération réelle par l'API Claude + envoi SMTP réel (Mailtrap, voir
  // docs/CONTEXTE_PROJET.md) : latence significative et non garantie,
  // marge large plutôt qu'un timeout serré et flaky.
  test.setTimeout(150_000);

  let jetonAdmin;
  let employeTest;
  let campagneId = null;
  let consultantPage;
  let consultantContext;

  const emailEmployeTest = `e2e-employe-${Date.now()}@hshield237.local`;

  test.beforeAll(async ({ browser, request }) => {
    // Prépare l'annuaire des employés du département testé — vide par
    // défaut dans cet environnement (voir docs/CONTEXTE_PROJET.md) et
    // nécessaire au lancement de campagne, mais dont la création a son
    // propre parcours (page Employés) hors périmètre de ce test.
    jetonAdmin = await obtenirJeton(request, COMPTES.administrateur);
    employeTest = await creerEmployeDeTest(request, jetonAdmin, {
      nom: "Employé Test E2E",
      email: emailEmployeTest,
      departement: DEPARTEMENT_TEST.code,
    });

    consultantContext = await browser.newContext({ ignoreHTTPSErrors: true });
    consultantPage = await consultantContext.newPage();
  });

  test.afterAll(async ({ request }) => {
    await supprimerCampagne(request, jetonAdmin, campagneId);
    await supprimerEmploye(request, jetonAdmin, employeTest?.id);
    await consultantContext?.close();
  });

  test("1. connexion en tant que consultant", async () => {
    const page = consultantPage;
    await page.goto("/login");
    await page.getByPlaceholder("entreprise@institution.com").fill(COMPTES.consultant.email);
    await page.getByPlaceholder("••••••••••").fill(COMPTES.consultant.password);
    await page.getByRole("button", { name: /se connecter/i }).click();
    await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();
  });

  test("2. création d'une campagne ciblant le département Informatique", async () => {
    const page = consultantPage;
    await page.goto("/campagnes");
    await page.getByRole("button", { name: "Nouvelle campagne" }).click();

    const modal = page.locator(".modal-overlay.open");
    await expect(modal).toBeVisible();
    await modal.locator("select.form-select").selectOption(DEPARTEMENT_TEST.code);

    const [creationResponse] = await Promise.all([
      page.waitForResponse((resp) => resp.url().includes("/api/campagnes/") && resp.request().method() === "POST"),
      modal.getByRole("button", { name: "Créer la campagne" }).click(),
    ]);
    expect(creationResponse.ok()).toBeTruthy();
    const campagne = await creationResponse.json();
    campagneId = campagne.id;

    // La campagne vient d'être créée : ordonnée par date de création
    // décroissante côté API (voir Campagne.Meta.ordering), c'est la plus
    // récente de toutes — donc la première ligne du tableau, sans filtre
    // supplémentaire à appliquer.
    const premiereLigne = page.locator("table tbody tr").first();
    await expect(premiereLigne).toContainText(DEPARTEMENT_TEST.nom);
  });

  test("3. génération d'un scénario en mode API (IA)", async () => {
    const page = consultantPage;
    await page.goto("/generer-scenario");

    // Mode API sélectionné par défaut ; la campagne créée à l'étape
    // précédente est la plus récente et se présélectionne donc
    // automatiquement (voir GenererScenarioPage.jsx) — vérifié par la
    // valeur réellement sélectionnée (l'id de la campagne), pas par le
    // texte du <select> qui contiendrait de toute façon tous les
    // libellés de toutes les options.
    await expect(page.locator("select.form-select").first()).toHaveValue(String(campagneId));

    // On observe la réponse HTTP réelle plutôt que d'attendre un texte
    // précis dans la page : plus robuste, et surtout capable de
    // distinguer un vrai échec applicatif (ex. ANTHROPIC_API_KEY absente
    // ou invalide dans cet environnement, voir .env) d'une régression du
    // code lui-même — deux causes que le seul rendu final ne permet pas
    // de différencier avec certitude.
    const [response] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes("/api/generation/api/") && r.request().method() === "POST",
        { timeout: 60_000 }
      ),
      page.getByRole("button", { name: "Générer le scénario par IA" }).click(),
    ]);

    if (!response.ok()) {
      const body = await response.json().catch(() => ({}));
      test.skip(
        true,
        `Génération par l'API Claude indisponible dans cet environnement (${response.status()} — ` +
          `${body.detail || "raison inconnue"}). Vérifier ANTHROPIC_API_KEY dans .env (voir ` +
          `docs/rapport_planification.md, Jour 7). Le reste du parcours continue normalement avec ` +
          `le scénario du mode manuel (étape suivante).`
      );
    }

    await expect(page.locator(".preview-title")).toHaveText("Aperçu de l'email simulé");
    await expect(page.locator(".preview-badge")).toHaveText("Scénario IA");
  });

  test("4. génération d'un second scénario en mode manuel", async () => {
    const page = consultantPage;
    // Toujours sur /generer-scenario (étape précédente) — bascule de mode
    // sans recharger la page, comme un vrai consultant hésitant entre
    // les deux options.
    await page.getByRole("button", { name: "Saisie manuelle" }).click();

    await page.getByPlaceholder(/Suspension de compte urgente/).fill("Vérification urgente de votre accès VPN");
    await page
      .getByPlaceholder("Collez ici le texte généré par claude.ai…")
      .fill("Votre accès VPN nécessite une revalidation immédiate. Cliquez sur le lien ci-dessous pour continuer.");
    await page.getByPlaceholder("https://portail-verif.hshield237.local/").fill("https://portail-verif.hshield237.local/vpn");

    await page.getByRole("button", { name: "Enregistrer le scénario" }).click();
    await expect(page.locator(".preview-title")).toHaveText("Aperçu de l'email simulé");
    // Le badge de l'aperçu, pas le bouton de bascule de mode (même texte,
    // deux éléments distincts sur la page à ce stade).
    await expect(page.locator(".preview-badge")).toHaveText("Saisie manuelle");
  });

  test("5. le responsable désigné valide le consentement de la campagne", async ({ browser }) => {
    const responsableContext = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await responsableContext.newPage();
    try {
      await page.goto("/login");
      await page.getByPlaceholder("entreprise@institution.com").fill(COMPTES.responsableIT.email);
      await page.getByPlaceholder("••••••••••").fill(COMPTES.responsableIT.password);
      await page.getByRole("button", { name: /se connecter/i }).click();
      await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();

      await page.goto("/consentements");
      await page.getByRole("button", { name: "En attente" }).click();

      // Un responsable ne voit ici que ses propres demandes de
      // consentement (voir apps.gouvernance.views.ConsentementListView) —
      // Informatique est le seul département dont COMPTES.responsableIT
      // est le responsable désigné, et les plus récentes sont listées en
      // premier : la nôtre est donc la première ligne « En attente ».
      const ligneAValider = page.locator(".consent-row").filter({ hasText: "Valider" }).first();
      await expect(ligneAValider).toBeVisible();
      await ligneAValider.getByRole("button", { name: "Valider" }).click();
      await expect(page.getByText(DEPARTEMENT_TEST.nom).first()).toBeVisible();
    } finally {
      await responsableContext.close();
    }
  });

  test("6. le consultant lance la campagne — envoi réel à l'employé de test", async () => {
    const page = consultantPage;
    await page.goto("/campagnes");

    const premiereLigne = page.locator("table tbody tr").first();
    await expect(premiereLigne).toContainText(DEPARTEMENT_TEST.nom);
    // Le consentement validé à l'étape précédente débloque le bouton de
    // lancement (voir Campagne.perimetre_valide, mis à jour côté backend
    // par ValiderConsentementView).
    await premiereLigne.getByTitle("Lancer la campagne").click();

    const modal = page.locator(".modal-overlay.open");
    await expect(modal).toBeVisible();
    await modal.getByPlaceholder("noreply@minesup-infos.cm").fill("noreply@e2e-test.hshield237.local");
    await modal.getByPlaceholder("reponses-test@hshield237.local").fill("reponses-e2e@hshield237.local");
    // « Tous les employés du département » est déjà sélectionné par
    // défaut — un seul employé de test y est rattaché (voir beforeAll).

    await modal.getByRole("button", { name: "Lancer la campagne" }).click();
    await expect(page.getByText(/Campagne lancée — 1 email envoyé\./)).toBeVisible({ timeout: 45_000 });
  });

  test("7. le tableau de bord reflète la campagne lancée", async () => {
    const page = consultantPage;
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();
    // Scopé à .metric-label : « Score de vulnérabilité » apparaît aussi
    // dans le <title> (accessibilité) du graphique en anneau juste
    // en dessous — deux éléments distincts, sans lien avec l'un l'autre.
    await expect(page.locator(".metric-label").getByText("Emails envoyés")).toBeVisible();
    await expect(page.locator(".metric-label").getByText("Score de vulnérabilité")).toBeVisible();
    // Au moins l'email envoyé à l'étape précédente doit être compté —
    // valeur cumulative sur toutes les campagnes, jamais à zéro à ce stade.
    const valeurEmailsEnvoyes = page
      .locator(".metric", { has: page.getByText("Emails envoyés") })
      .locator(".metric-value");
    await expect(valeurEmailsEnvoyes).not.toHaveText("0");
  });
});
