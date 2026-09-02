# Tests end-to-end (Playwright) — H-SHIELD237

Tests des parcours critiques (Jour 18 du sprint, voir
`docs/rapport_planification.md`), exécutés contre l'**environnement
Docker complet déjà démarré** — pas contre un serveur de développement
isolé (`npm run dev`). Playwright pilote un vrai navigateur (Chromium) et
passe par Nginx, exactement comme un utilisateur réel.

## Prérequis

1. La pile complète doit déjà tourner :
   ```
   docker compose up -d
   docker compose ps   # les 4 services doivent être "healthy"
   ```
2. Node.js (LTS 20+, voir `docs/rapport_planification.md` section 1) et
   npm disponibles sur la machine — Playwright pilote le navigateur
   depuis l'hôte, pas depuis un conteneur.
3. Comptes de test déjà présents en base (voir
   `docs/CONTEXTE_PROJET.md`, « Prochaine action précise ») :
   `consultant@hshield237.local`, `administrateur@hshield237.local`,
   `responsable@hshield237.local` (désigné pour Informatique). Ces
   identifiants par défaut sont surchargeables par variable
   d'environnement (voir `utils/comptes.js`) pour cibler un autre
   environnement sans modifier les tests.

## Installation (une seule fois)

```
cd e2e
npm install
npm run install-browsers
```

## Exécution

```
npm test              # tous les tests, mode headless
npm run test:headed   # navigateur visible
npm run test:ui       # mode interactif Playwright (pas à pas)
npm run report        # rouvre le dernier rapport HTML
```

Par défaut, les tests visent `https://localhost` (le port exposé par
Nginx dans `docker-compose.yml`, certificat auto-signé — voir
`nginx/certs/README.md`). Pour cibler un autre environnement :

```
E2E_BASE_URL=https://mon-serveur.example.cm npm test
```

## Contenu

- `tests/connexion.spec.js` — connexion (succès, échec explicite,
  déconnexion, protection des routes sans session).
- `tests/parcours-critique.spec.js` — parcours métier complet en une
  seule séquence dépendante (`describe.serial`) : création d'une
  campagne, génération de scénario en mode API puis en mode manuel,
  validation du consentement par le responsable désigné (second
  contexte de navigateur — deux rôles, deux sessions), lancement de la
  campagne, et vérification que le tableau de bord reflète l'envoi
  réel.

**Écart assumé** : l'énoncé du Jour 18 mentionne « création
d'entreprise », mais le modèle `Entreprise` a été entièrement supprimé
au Jour 6 (application mono-entreprise, segmentée par département —
voir `docs/CONTEXTE_PROJET.md`, « Décisions et écarts », n°1). Le
parcours couvre donc la création d'une campagne ciblant un département,
son équivalent réel dans l'application telle qu'elle existe aujourd'hui.

## Effets de bord réels, assumés

Ce ne sont pas des tests unitaires isolés : `parcours-critique.spec.js`
appelle réellement l'API Claude (génération en mode API) et envoie
réellement un email via le compte SMTP configuré (Mailtrap en
développement, voir `docs/CONTEXTE_PROJET.md`) — cohérent avec la
convention de vérification en conditions réelles déjà suivie tout au
long de ce projet, plutôt que de tout simuler. Toute donnée de test
créée (employé, campagne) est supprimée automatiquement à la fin de
l'exécution (`test.afterAll`), y compris si un test échoue en cours de
route. Prévoir une clé `ANTHROPIC_API_KEY` valide et un compte SMTP de
test fonctionnels dans `.env` avant de lancer la suite complète.
