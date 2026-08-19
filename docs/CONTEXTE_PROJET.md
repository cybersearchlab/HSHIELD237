# Contexte du projet H-SHIELD237 — reprise de session

> Document de reprise rapide pour une nouvelle session Claude Code. Réfère-toi à
> `docs/rapport_planification.md` pour le détail de chaque jour du sprint (20 jours,
> 14 août → 2 septembre 2026).

## État d'avancement

- **Dernier jour entièrement terminé, vérifié ET poussé sur GitHub : Jour 6**
  (module Campagnes backend + frontend, page Campagnes connectée à l'API réelle).
- **Jour en cours : Jour 7** (génération de scénario — API Claude + mode manuel).
  - ✅ Backend fait, vérifié en conditions réelles, **committé et poussé**
    (commit `f1f8ad2`).
  - ✅ Frontend fait (sélecteur API/Manuel, page `GenererScenarioPage`),
    **vérifié en conditions réelles via le proxy Vite**, mais **PAS ENCORE
    committé ni poussé** — c'est la toute prochaine action (voir dernière
    section).
- Jalon 1 (jour 5, connexion + interface visible en Docker complet) : **atteint**.

## Modules implémentés

### Backend (`backend/apps/`)

| App | État | Détail |
|---|---|---|
| `accounts` | ✅ Fait | Modèle `Utilisateur` (AbstractUser + `role`), JWT (login/refresh/me), permissions `IsConsultant`/`IsResponsable`/`IsAdministrateur` |
| `entreprises` | ❌ **Supprimée** | Retirée au jour 6 — voir « Décisions et écarts » |
| `campagnes` | ✅ Fait | Modèles `Campagne` (departement, statut, perimetre_valide) et `ScenarioPhishing` (+ `piece_jointe`), ViewSet CRUD, filtres statut/departement, pagination, fixture de test |
| `generation` | ✅ Fait (backend) | `ClaudeGenerationService`, endpoints `/api/generation/api/` et `/api/generation/manuel/` (multipart, pièce jointe) |
| `simulation` | ⬜ Pas commencé | Prévu jour 8 (SMTP, tracking) et jour 9 (pixel, clics) |
| `gouvernance` | ⬜ Pas commencé | Prévu jour 11 (Consentement, JournalAudit) |
| `rapports` | ⬜ Pas commencé | Prévu jour 13 (PDF via WeasyPrint) |
| `templates_sectoriels` | ⬜ Pas commencé | Prévu jour 14 |

### Frontend (`frontend/src/pages/`)

| Page | État | Détail |
|---|---|---|
| `Login/LoginPage.jsx` | ✅ Fait | Fidèle à `login.html`, connectée à l'API |
| `components/Layout/` | ✅ Fait | Sidebar/topbar de référence, importé par toutes les pages |
| `Dashboard/DashboardPage.jsx` | 🟡 Placeholder minimal | Affiche juste l'utilisateur connecté ; le vrai contenu (métriques, tableau campagnes) arrive jour 12 |
| `Campagnes/CampagnesPage.jsx` | ✅ Fait | Tableau, recherche, filtres statut, pagination réelle, actions rapides, modale de création |
| `GenererScenario/GenererScenarioPage.jsx` | ✅ Fait, **non committé** | Sélecteur API/Manuel, formulaire adapté (département au lieu d'entreprise) |
| Résultats, RapportsPDF, Historique, TemplatesSectoriels, Consentements, Paramètres | ⬜ Pas commencé | Liens de nav déjà présents dans `navConfig.js`, pointent vers des routes non câblées (redirection vers `/`) |

## Décisions ou écarts par rapport au plan

1. **Le modèle `Entreprise` a été entièrement supprimé** (app `apps/entreprises/` retirée, route `/api/entreprises/` n'existe plus) et remplacé par un champ `departement` (CharField à choix fixes) directement sur `Campagne`. Décision utilisateur explicite au jour 6 : l'application ne sert qu'une seule entreprise cliente, donc la segmentation se fait par département, pas par client. **Impact futur** : le jour 10 du plan (« ajoute un champ département ») est déjà partiellement fait ; les jours qui referont référence à « l'entreprise » (ex. contexte de génération jour 7) doivent être lus comme « le département ».
2. **`django-filter`** ajouté aux dépendances (non prévu explicitement dans le plan) pour les filtres DRF de `CampagnesViewSet`.
3. **Bind mounts Docker retirés** (`./backend:/app` et `./nginx/certs:/etc/nginx/certs`) suite à une instabilité de partage de fichiers Docker Desktop (bind mounts montés vides, backend et nginx en crash-loop). Conséquences :
   - Le code backend est désormais figé dans l'image → **il faut reconstruire l'image (`docker compose build backend`) après CHAQUE changement de code backend**, plus de rechargement à chaud via bind mount.
   - Les certificats TLS de nginx sont copiés dans l'image (`nginx/Dockerfile` : `COPY certs/ /etc/nginx/certs/`) au lieu d'être montés au démarrage.
   - Conséquence pratique : générer une migration nécessite maintenant soit de l'écrire à la main, soit de la générer puis rebuild l'image avant `migrate` (une migration créée dans un conteneur `--rm` est perdue à sa sortie).
4. **Volume `media_data`** ajouté (`docker-compose.yml`) pour la persistance des pièces jointes (`ScenarioPhishing.piece_jointe`). Le `Dockerfile` backend crée `/app/media` et `/app/staticfiles` **avant** le `chown` vers `appuser`, sinon le volume est initialisé avec les mauvaises permissions (root) et les uploads échouent en 500.
5. **`ANTHROPIC_MODEL`** ajouté comme variable d'environnement configurable (pas dans le plan initial) — évite de coder en dur un identifiant de modèle qui peut changer.
6. Les endpoints de génération (`/api/generation/api/` et `/api/generation/manuel/`) sont réservés aux rôles `consultant`/`administrateur`, comme les autres endpoints métier (cohérence, pas explicitement demandé pour ce module précis).

## Variables d'environnement (`.env`, jamais commité)

**Renseignées avec une vraie valeur locale** : `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `DATABASE_URL`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`.

**Présentes mais avec une valeur invalide/placeholder** :
- `ANTHROPIC_API_KEY` — l'utilisateur n'a pas encore payé/provisionné de clé sur console.anthropic.com. Le service `ClaudeGenerationService` gère déjà ce cas proprement (renvoie une 503 avec message clair au lieu de planter). **Le mode manuel fonctionne dès maintenant sans cette clé.**

**Absentes du `.env` actuel** (donc valeurs par défaut du code utilisées) :
- `CORS_ALLOWED_ORIGINS` — non bloquant en dev (`dev.py` a un défaut)
- `ANTHROPIC_MODEL` — défaut code : `claude-sonnet-4-5-20250929` (à vérifier sur console.anthropic.com une fois la clé provisionnée)
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` — à renseigner au jour 8 (SMTP)
- `VITE_API_BASE_URL` — non nécessaire (le proxy Vite/nginx gère `/api` en relatif)

## Bugs connus ou points bloquants

- **Aucun bug actif** au moment de la rédaction. Les 4 services Docker (`db`, `backend`, `frontend`, `nginx`) sont `healthy`.
- **Point de vigilance permanent** : ne plus compter sur un bind mount pour le code backend (voir écart n°3) — toujours rebuild l'image après modification de code Python, et écrire les migrations à la main si `docker compose run --rm` est utilisé pour les générer.
- Compte de test disponibles : `admin@hshield237.local` / `AdminTest1234!` (rôle employe) et `consultant@hshield237.local` / `Consultant1234!` (rôle consultant, à utiliser pour tester campagnes/génération).

## Prochaine action précise

1. **Committer et pousser le travail frontend du jour 7** (actuellement non commité) :
   ```
   git add frontend/src/App.jsx frontend/src/pages/Campagnes/CampagnesPage.jsx frontend/src/styles/components.css frontend/src/api/generation.js frontend/src/pages/GenererScenario frontend/src/utils/departements.js frontend/src/utils/statuts.js
   git commit -m "feat(generation): selecteur API/Manuel sur la page Generer un scenario (frontend)"
   git push origin main
   ```
2. Puis enchaîner sur le **Jour 8** du plan (`docs/rapport_planification.md`) : `apps/simulation/` — `EnvoiCampagneService` (SMTP natif Django, expéditeur configurable, limitation de débit) + vue publique de fausse page de capture avec tracking. Nécessitera de renseigner `EMAIL_HOST`/`EMAIL_PORT`/`EMAIL_HOST_USER`/`EMAIL_HOST_PASSWORD` dans `.env` (un compte SMTP de test type Mailtrap est recommandé par le plan, jamais de vrais emails en dev).
