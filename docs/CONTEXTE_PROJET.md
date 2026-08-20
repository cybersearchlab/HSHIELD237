# Contexte du projet H-SHIELD237 — reprise de session

> Document de reprise rapide pour une nouvelle session Claude Code. Réfère-toi à
> `docs/rapport_planification.md` pour le détail de chaque jour du sprint (20 jours,
> 14 août → 2 septembre 2026).

## État d'avancement

- **Dernier jour entièrement terminé, vérifié ET poussé sur GitHub : Jour 9**
  (modèle `Interaction`, pixel de suivi, tracking clic/soumission, tests
  automatisés) — voir « Journal du 2026-08-20 » ci-dessous.
  - ✅ Backend fait, vérifié en conditions réelles (pixel, clic, soumission
    tous confirmés via curl + interactions visibles en base).
  - ✅ Test automatisé écrit et exécuté avec succès (`3 tests OK`).
  - ✅ Committé et poussé (commits `7247586`, `7ed1a2c`, `9b0cd10`).
- Jour 8 (envoi SMTP, expéditeur configurable, fausse page de capture) reste
  entièrement terminé, vérifié, **committé et poussé** (commits `0630615`,
  `7d7d8d0`).
- Jour 7 (génération de scénario) reste entièrement terminé, vérifié et
  poussé (commits `f1f8ad2`, `42fc3bb`, `3b33198`).
- Jalon 1 (jour 5, connexion + interface visible en Docker complet) : **atteint**.
- Jalon 2 (jour 10, scénario généré + envoyé par département + tracking) :
  **pas encore atteint** — l'envoi (jour 8) et le tracking des interactions
  (jour 9) sont faits ; il manque uniquement la segmentation par département
  (jour 10).

## Journal du 2026-08-19 (session de suivi post-Jour 7)

Travail réalisé en dehors d'un prompt de jour du plan, sur demande directe
de l'utilisateur après tests manuels de la page « Générer un scénario » :

1. **Correctif critique** : `generateManuel()` (frontend) forçait le header
   `Content-Type: multipart/form-data` sans `boundary`, ce qui rendait le
   corps de la requête illisible côté serveur et empêchait tout
   enregistrement en mode manuel. Corrigé en laissant axios générer ce
   header automatiquement pour un `FormData`.
2. **Nouveaux champs sur `ScenarioPhishing`** (migration `0003`) :
   `expediteur_nom`, `expediteur_email`, `destinataire_email`, `est_html`
   — tous optionnels (`blank=True`), donc sans impact sur le chemin API
   (Claude) qui ne les renseigne pas.
3. **Aperçu de l'email simulé enrichi** (mode manuel) :
   - lignes « De : » / « À : » basées sur les nouveaux champs ;
   - l'URL de la fausse page n'apparaît plus en texte brut dans les
     métadonnées — elle est affichée comme bouton CTA (`.email-cta`) en
     fin d'email, ouvrant la page dans un nouvel onglet ;
   - bouton « Créer une campagne » ajouté aux actions de l'aperçu
     (navigue vers `/campagnes`) ;
   - mode **Texte / HTML** sur le corps de l'email : en HTML, un bouton
     « Insérer une image » ajoute une balise `<img>` à partir d'une URL
     saisie, et l'aperçu propose deux onglets (« Aperçu » rendu via
     `dangerouslySetInnerHTML`, et « Code HTML » brut).
4. **Validation de formulaire côté frontend** : chaque champ invalide du
   mode manuel (email mal formé, URL invalide, champ requis vide) affiche
   un contour rouge et un message d'erreur en français sous le champ,
   à la fois pour les erreurs de validation client et pour les erreurs
   renvoyées par l'API (`error.response.data`).
5. **Ergonomie du scroll** : après clic sur « Enregistrer le scénario »
   (ou pendant le chargement), la page défile automatiquement jusqu'à la
   carte d'aperçu — avec un `scroll-margin-top` pour compenser la topbar
   `position: sticky` qui masquait sinon le titre « Aperçu de l'email
   simulé ». En cas d'erreur de validation, le scroll cible directement
   le premier champ en erreur (`block: "center"`, avec focus).
6. **Validation native du navigateur désactivée** (`noValidate` sur le
   `<form>`) — la bulle HTML5 native (`Please enter a URL.`, en anglais)
   ne s'affiche plus ; seuls les messages personnalisés en français sont
   montrés désormais.

Aucune régression connue. Les 4 services Docker restent `healthy` après
chaque rebuild. Migration `0003` appliquée manuellement (voir écart n°3
plus bas — toujours pas de bind mount backend).

## Journal du 2026-08-20 (Jours 8 et 9 — envoi SMTP, tracking des interactions)

### Jour 8 — envoi SMTP, anti-spam, capture

1. **Backend `apps/simulation/`** : modèles `ConfigurationEnvoi` (expéditeur
   affiché, Reply-To, délai entre envois — par campagne) et `EnvoiTracking`
   (UUID par envoi, sert d'identifiant de tracking dans l'URL de capture).
   `EnvoiCampagneService` envoie via le backend SMTP natif de Django,
   respecte le délai configuré (`time.sleep` synchrone entre deux envois),
   et propage proprement toute erreur SMTP (`EnvoiCampagneError` → 400).
2. **Vue publique** `GET /simulation/capture/<uuid>/` : sert une fausse page
   de vérification générique (template `apps/simulation/templates/simulation/capture.html`),
   sans authentification.
3. **Endpoints** `GET/PUT /api/simulation/campagnes/{id}/configuration/` et
   `POST /api/simulation/campagnes/{id}/envoyer/`, réservés aux rôles
   consultant/administrateur.
4. **Frontend** : nouvelle modale de lancement sur `CampagnesPage.jsx` (le
   clic sur « Lancer » n'active plus directement la campagne — il ouvre la
   modale, sauvegarde la configuration d'envoi, déclenche l'envoi réel, puis
   passe la campagne à `active` seulement si l'envoi réussit). Nouveau
   fichier `frontend/src/api/simulation.js`.
5. **Bug d'infrastructure trouvé et corrigé** : nginx ne routait pas
   `/simulation/` vers le backend (seuls `/api/`, `/admin/`, `/static/`
   l'étaient) — la fausse page de capture renvoyait la page React au lieu
   de la vue Django. Ajouté `location /simulation/` et, au passage,
   `location /media/` (même trou pour les pièces jointes de scénario) dans
   `nginx/conf.d/default.conf`.
6. **Vérification réelle complète** : configuration sauvegardée, scénario
   envoyé via Mailtrap (confirmé par capture d'écran de l'inbox Mailtrap —
   expéditeur affiché et lien de capture corrects), page de capture publique
   testée avec un UUID valide (`200`) et invalide (`404`). Un test isolé
   avec le backend console de Django a permis de confirmer que le service
   compose correctement From/Reply-To/corps/lien même quand Mailtrap
   applique sa limite de débit (voir écart n°12).
7. Petite correction de texte sur `GenererScenarioPage.jsx` (retrait d'une
   liste d'exemples d'institutions dans le texte d'intro du mode API, sur
   demande explicite de l'utilisateur).

Jour 8 committé et poussé sur GitHub le même jour (commits `0630615`, `7d7d8d0`).

### Jour 9 — modèle `Interaction`, pixel de suivi, clic, soumission

1. **Modèle `Interaction`** (migration `0002_interaction`) : `envoi` (FK vers
   `EnvoiTracking`), `type` (ouverture/clic/soumission/signalement),
   `horodatage`, `adresse_ip`. Voir écart n°13 pour le choix du FK.
2. **Pixel de suivi** `GET /simulation/pixel/<uuid>/` : image GIF 1x1
   transparente, enregistre un événement `ouverture` à chaque chargement.
3. **`EnvoiCampagneService` modifié** pour joindre systématiquement une
   alternative HTML (même quand le scénario est en mode texte) contenant le
   pixel — voir écart n°14. Le corps texte visible par le destinataire reste
   inchangé.
4. **Fausse page de capture enrichie** : `GET` enregistre un `clic`, `POST`
   du formulaire enregistre une `soumission` puis affiche un message neutre
   de confirmation à la place du formulaire — sans jamais lire ni stocker
   l'email/mot de passe saisis par la personne testée.
5. **Vérification réelle complète** : `GET capture` → `200` + `clic` en
   base ; `GET pixel` → `200`, `image/gif` + `ouverture` en base ; `POST
   capture` → `200`, message neutre + `soumission` en base, avec adresse IP
   capturée pour chacun. Test isolé (backend console) confirmant la balise
   `<img>` du pixel correctement présente dans l'email réel envoyé.
6. **Deux rebuilds backend ont échoué** à cause d'une erreur réseau
   transitoire lors du téléchargement de l'image Docker de base
   (`python:3.12-slim`, `unexpected EOF` depuis le registre Docker Hub) —
   sans lien avec le code, résolu au 3ᵉ essai (voir « Bugs connus »).

7. **Test automatisé écrit** (`backend/apps/simulation/tests.py`, via
   `django.test.TestCase` + client de test Django, sans dépendance à
   Mailtrap ni à un navigateur) : parcours complet pixel → clic →
   soumission avec vérification de l'ordre et de l'horodatage des 3
   `Interaction` ; identifiant de tracking inconnu → `404` ; absence de
   tout champ pouvant stocker un identifiant saisi sur la soumission.
   Exécuté avec succès : `docker compose exec backend python manage.py
   test apps.simulation` → `Ran 3 tests ... OK`.

Aucune régression connue. Les 4 services Docker sont `healthy`. Jour 9
committé et poussé sur GitHub (commits `7247586`, `7ed1a2c`, `9b0cd10`).

## Modules implémentés

### Backend (`backend/apps/`)

| App | État | Détail |
|---|---|---|
| `accounts` | ✅ Fait | Modèle `Utilisateur` (AbstractUser + `role`), JWT (login/refresh/me), permissions `IsConsultant`/`IsResponsable`/`IsAdministrateur` |
| `entreprises` | ❌ **Supprimée** | Retirée au jour 6 — voir « Décisions et écarts » |
| `campagnes` | ✅ Fait | Modèles `Campagne` (departement, statut, perimetre_valide) et `ScenarioPhishing` (+ `piece_jointe`), ViewSet CRUD, filtres statut/departement, pagination, fixture de test |
| `generation` | ✅ Fait | `ClaudeGenerationService`, endpoints `/api/generation/api/` et `/api/generation/manuel/` (multipart, pièce jointe) ; `ScenarioPhishing` étendu avec expediteur_nom/expediteur_email/destinataire_email/est_html |
| `simulation` | ✅ Fait (jours 8-9) | `EnvoiCampagneService`, `ConfigurationEnvoi`, `EnvoiTracking`, vue publique de capture (jour 8) ; modèle `Interaction`, pixel de suivi, tracking clic/soumission, `tests.py` (3 tests, jour 9). **Manque encore** : déclencheur du type `signalement` (aucun mécanisme prévu au jour 9), segmentation par département (jour 10) |
| `gouvernance` | ⬜ Pas commencé | Prévu jour 11 (Consentement, JournalAudit) |
| `rapports` | ⬜ Pas commencé | Prévu jour 13 (PDF via WeasyPrint) |
| `templates_sectoriels` | ⬜ Pas commencé | Prévu jour 14 |

### Frontend (`frontend/src/pages/`)

| Page | État | Détail |
|---|---|---|
| `Login/LoginPage.jsx` | ✅ Fait | Fidèle à `login.html`, connectée à l'API |
| `components/Layout/` | ✅ Fait | Sidebar/topbar de référence, importé par toutes les pages |
| `Dashboard/DashboardPage.jsx` | 🟡 Placeholder minimal | Affiche juste l'utilisateur connecté ; le vrai contenu (métriques, tableau campagnes) arrive jour 12 |
| `Campagnes/CampagnesPage.jsx` | ✅ Fait | Tableau, recherche, filtres statut, pagination réelle, actions rapides, modale de création, **modale de lancement** (expéditeur/Reply-To/débit + avertissement DNS, jour 8) |
| `GenererScenario/GenererScenarioPage.jsx` | ✅ Fait | Sélecteur API/Manuel, formulaire adapté (département), aperçu enrichi (De/À, CTA, mode HTML), validation inline, scroll automatique — voir « Journal du 2026-08-19 » |
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
7. **Champs expéditeur/destinataire ajoutés à `ScenarioPhishing`** (et non à un futur modèle `Destinataire`, qui n'existe pas encore — prévu jour 9/10). Décision utilisateur du 2026-08-19 : besoin immédiat d'afficher un aperçu d'email réaliste (De/À) en mode manuel, avant que la vraie segmentation par destinataire n'existe. **Point de vigilance pour le jour 8/10** : `destinataire_email` ici n'est qu'un email de test rattaché au scénario, à ne pas confondre avec le futur modèle `Destinataire` (liste réelle de destinataires par campagne) — il faudra clarifier la relation entre les deux au moment d'implémenter l'envoi de masse.
8. **`ConfigurationEnvoi` et `EnvoiTracking` créés comme modèles séparés dans `apps.simulation`** (pas de champ ajouté directement sur `Campagne`/`ScenarioPhishing`). `ConfigurationEnvoi` est en `OneToOne` avec `Campagne`, auto-créé (valeurs vides) au premier `GET` de la configuration pour simplifier le frontend (pas de gestion d'un état « non configuré »).
9. **Le débit d'envoi est implémenté en synchrone** (`time.sleep()` dans la vue/service, pendant la requête HTTP), conformément à la formulation littérale du plan (« un email toutes les 2 secondes »). Aucune file de tâches asynchrone (Celery/RQ) n'a été introduite ce sprint. **Point de vigilance** : pour un grand nombre de destinataires, cela bloquera la requête HTTP pendant toute la durée de l'envoi — acceptable pour la taille actuelle des campagnes de test, à surveiller si le volume augmente.
10. **Le bouton « Lancer » d'une campagne ne se contente plus de changer son statut** : il ouvre désormais une modale de configuration d'envoi, déclenche un envoi SMTP réel via `EnvoiCampagneService`, et ne passe la campagne à `active` qu'en cas de succès de l'envoi. Écart par rapport au comportement simplifié du jour 6 (qui appelait directement `PATCH statut=active`).
11. **Nginx ne proxyait pas `/simulation/` ni `/media/` vers le backend** (seuls `/api/`, `/admin/`, `/static/` l'étaient depuis le jour 1/5) — trou découvert en testant la fausse page de capture (qui renvoyait la page React). Corrigé dans `nginx/conf.d/default.conf` ; concerne aussi l'accès public aux pièces jointes de scénario (jour 7), qui était silencieusement cassé jusqu'ici.
12. **Le plan gratuit Mailtrap limite le débit d'envoi** (« Too many emails per second ») plus strictement que le débit configuré côté application. Ce n'est pas un défaut du code — confirmé par un test isolé avec le backend console de Django, qui montre que `EnvoiCampagneService` compose correctement chaque email (From, Reply-To, corps, lien de capture) indépendamment de Mailtrap. À garder en tête pour les tests manuels : espacer les tentatives d'envoi de campagne.
13. **Le « destinataire FK » du modèle `Interaction`, demandé littéralement par le plan (jour 9), pointe vers `EnvoiTracking`** (champ `envoi`) plutôt que vers un modèle `Destinataire` qui n'existe pas encore. `EnvoiTracking` identifie déjà de façon unique « ce scénario envoyé à ce destinataire » (voir écart n°8) — c'est le bon niveau de granularité pour rattacher un événement d'interaction. **Point de vigilance jour 10** : quand le modèle `Destinataire` sera créé, clarifier explicitement sa relation avec `EnvoiTracking.destinataire_email`.
14. **Le pixel de suivi impose une alternative HTML systématique**, même pour les scénarios en mode texte (`est_html=False`) — un pixel invisible ne peut être chargé que par un client email capable d'afficher du HTML. Le corps texte visible reste inchangé ; seule une version HTML supplémentaire (contenant le même texte échappé + le pixel) est jointe en `text/html` via `EmailMultiAlternatives.attach_alternative`.
15. **La vue de la fausse page de capture est marquée `csrf_exempt`** pour accepter la soumission du formulaire (POST) : c'est une page publique sans session ni compte, censée imiter un vrai site externe (un vrai attaquant n'utilise pas de jeton CSRF Django). Aucune valeur saisie (email, mot de passe) n'est lue ni stockée par la vue — seul l'événement `soumission` (horodatage + adresse IP) est enregistré.
16. **Le type `signalement` existe dans l'énumération `Interaction.type`** (demandé littéralement par le plan) mais n'a aucun déclencheur automatique construit ce jour — le plan ne décrit pas de mécanisme pour cet événement au jour 9 (probablement à raccorder plus tard à l'adresse Reply-To de test définie au jour 8).
17. **Premier fichier de tests automatisés du projet** : `backend/apps/simulation/tests.py`. Aucune infrastructure de test n'existait avant (pas de `tests/` à la racine de `backend/`, malgré sa présence dans l'arborescence prévue par le plan) — ce fichier suit la convention Django standard (`tests.py` par app) plutôt que le dossier `backend/tests/` du plan initial, cohérent avec la structure réelle du reste du backend (chaque app a son propre code, pas de dossier de tests centralisé).

## Variables d'environnement (`.env`, jamais commité)

**Renseignées avec une vraie valeur locale** : `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `DATABASE_URL`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`.

**Renseignées le 2026-08-20 avec un compte de test Mailtrap (Sandbox)** :
`EMAIL_HOST` (`sandbox.smtp.mailtrap.io`), `EMAIL_PORT` (`587`),
`EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS` (`True`). Aucun
email réel envoyé — capturé dans l'inbox Mailtrap. Rate-limité par le plan
gratuit (voir écart n°12).

**Présentes mais avec une valeur invalide/placeholder** :
- `ANTHROPIC_API_KEY` — l'utilisateur n'a pas encore payé/provisionné de clé sur console.anthropic.com. Le service `ClaudeGenerationService` gère déjà ce cas proprement (renvoie une 503 avec message clair au lieu de planter). **Le mode manuel fonctionne dès maintenant sans cette clé.**

**Absentes du `.env` actuel** (donc valeurs par défaut du code utilisées) :
- `CORS_ALLOWED_ORIGINS` — non bloquant en dev (`dev.py` a un défaut)
- `ANTHROPIC_MODEL` — défaut code : `claude-sonnet-4-5-20250929` (à vérifier sur console.anthropic.com une fois la clé provisionnée)
- `SIMULATION_BASE_URL` — défaut code : `https://localhost` (correct pour l'environnement local actuel ; à renseigner explicitement lors d'un déploiement sur un vrai domaine, pour que le lien de capture dans les emails pointe au bon endroit)
- `VITE_API_BASE_URL` — non nécessaire (le proxy Vite/nginx gère `/api` en relatif)

## Bugs connus ou points bloquants

- **Aucun bug actif** au niveau applicatif. Le code des jours 8 et 9 est
  vérifié et fonctionnel de bout en bout (voir « Journal du 2026-08-20 »),
  y compris via un test automatisé qui passe (`3 tests OK`).
- **Contrainte externe à garder en tête** : le plan gratuit Mailtrap limite
  le débit d'envoi plus strictement que le débit configuré côté
  application — espacer les tentatives d'envoi de campagne pendant les
  tests manuels (voir écart n°12). N'affecte pas la correction du code.
- **Point de vigilance permanent** : ne plus compter sur un bind mount pour le code backend (voir écart n°3) — toujours rebuild l'image après modification de code Python (**y compris nginx** si `nginx/conf.d/` change), et écrire les migrations à la main si `docker compose run --rm` est utilisé pour les générer.
- **Docker Desktop / Docker Hub restent occasionnellement instables** : après un restart de Docker Desktop, vérifier que l'image utilisée par un conteneur recréé est bien la plus récente (`docker images <nom> --format "{{.ID}} {{.CreatedAt}}"`) — un rebuild peut se perdre si le moteur redémarre pendant ou juste après. Un rebuild peut aussi échouer avec une erreur réseau (`unexpected EOF`) en tirant l'image de base depuis Docker Hub — relancer simplement `docker compose build` suffit en général.
- Comptes de test disponibles : `admin@hshield237.local` / `AdminTest1234!` (rôle employe) et `consultant@hshield237.local` / `Consultant1234!` (rôle consultant, à utiliser pour tester campagnes/génération/envoi).

## Prochaine action précise

Le Jour 9 est entièrement terminé, vérifié (y compris par test automatisé)
et poussé sur GitHub (commits `7247586`, `7ed1a2c`, `9b0cd10`). Rien en
attente côté commit/push.

**Prochaine étape** : **Jour 10** du plan (`docs/rapport_planification.md`) —
segmentation par département. **Attention** : le prompt du jour 10 suppose
l'existence d'un modèle `Destinataire` (« ajoute un champ departement au
modèle Destinataire ») — **ce modèle n'existe pas encore** dans le code
actuel (voir écarts n°7 et 13 : seuls `ScenarioPhishing.destinataire_email`
et `EnvoiTracking.destinataire_email` existent comme champs email de test).
Il faudra donc probablement créer ce modèle à cette occasion plutôt que
simplement lui ajouter un champ, et clarifier sa relation avec l'existant
avant d'adapter `EnvoiCampagneService` pour sélectionner le bon scénario
par département au moment de l'envoi. Ce sera aussi l'occasion d'écrire des
tests pour ce module (voir écart n°17 — premier fichier de tests du projet,
`apps/simulation/tests.py`, à prendre comme référence de style).
