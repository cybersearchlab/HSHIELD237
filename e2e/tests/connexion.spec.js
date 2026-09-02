import { expect, test } from "@playwright/test";

import { COMPTES } from "../utils/comptes.js";

// Parcours critique n°1 (docs/rapport_planification.md, Jour 18) :
// connexion. Un test par comportement attendu — succès, échec explicite,
// déconnexion — plutôt qu'un seul test enchaînant les trois, pour que
// l'échec de l'un n'empêche pas de savoir si les autres fonctionnent.

async function remplirFormulaireConnexion(page, { email, password }) {
  await page.goto("/login");
  await page.getByPlaceholder("entreprise@institution.com").fill(email);
  await page.getByPlaceholder("••••••••••").fill(password);
  await page.getByRole("button", { name: /se connecter/i }).click();
}

test.describe("Connexion", () => {
  test("des identifiants valides mènent au tableau de bord", async ({ page }) => {
    await remplirFormulaireConnexion(page, COMPTES.consultant);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();
  });

  test("un mot de passe incorrect affiche une erreur explicite, sans connecter", async ({ page }) => {
    await remplirFormulaireConnexion(page, { email: COMPTES.consultant.email, password: "MauvaisMotDePasse123!" });
    await expect(page.getByText("Adresse email ou mot de passe incorrect.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("une page protégée redirige vers la connexion sans session active", async ({ page }) => {
    await page.goto("/campagnes");
    await expect(page).toHaveURL(/\/login/);
  });

  test("la déconnexion ramène à la page de connexion", async ({ page }) => {
    await remplirFormulaireConnexion(page, COMPTES.consultant);
    await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();

    await page.getByRole("button", { name: "Se déconnecter" }).click();
    await expect(page).toHaveURL(/\/login/);

    // Une fois déconnecté, une page protégée ne doit plus être accessible
    // sans se reconnecter (jeton bien effacé, pas seulement l'affichage).
    await page.goto("/campagnes");
    await expect(page).toHaveURL(/\/login/);
  });
});
