# Contexte du projet H-SHIELD237 — reprise de session

> Document de reprise rapide pour une nouvelle session Claude Code. Réfère-toi à
> `docs/rapport_planification.md` pour le détail de chaque jour du sprint (20 jours,
> 14 août → 2 septembre 2026).

## État d'avancement

- **2026-08-27 (demande de l'encadreur, hors plan des 20 jours — chantier en
  deux étapes) : les deux étapes sont terminées.**
  **Étape 1/2** — les 10 départements figés en dur sont remplacés par un
  registre en base (`DepartementConfigure`), géré par l'administrateur
  (créer/renommer/supprimer, page `/departements`), propagé immédiatement
  partout (libellés, sélecteurs, agrégations). Committé et poussé (commit
  `86450c9`). Voir « Journal du 2026-08-27 (suite 4) ».
  **Étape 2/2** — annuaire des employés par département (page `/employes`,
  admin uniquement) remplaçant l'adresse de diffusion ; au lancement d'une
  campagne, le consultant choisit désormais « tous les employés du
  département » ou « un employé en particulier », chacun recevant un
  email individuel. Committé et poussé (commit `951571e`). Voir « Journal
  du 2026-08-27 (suite 5) ».
- **2026-08-27 (suite de session, après les corrections déjà validées le
  même jour)** : troisième retour utilisateur sur la modale « Voir
  l'email » — quand une campagne a plusieurs versions de scénario, elles
  s'affichaient toutes empilées dans la même boîte de dialogue, sans
  ordre. Corrigé par un sélecteur de versions classé par date (la plus
  récente en premier), avec un nouveau champ `ScenarioPhishing.date_creation`
  côté backend. Voir « Journal du 2026-08-27 (suite 3) » plus bas.
  Committé et poussé (commit `805033f`).
- **2026-08-27 (suite de session, après les trois changements de
  gouvernance/ergonomie déjà validés le même jour)** : deux corrections
  supplémentaires demandées dans la foulée, toutes deux hors plan des 20
  jours — suppression d'un doublon d'affichage de l'objet dans l'aperçu
  d'email (« Générer un scénario » + modale « Voir l'email »), et ajout
  d'un bouton de bascule mode sombre / mode clair dans la Topbar,
  persistant via `localStorage`. Aucun nouveau jour du plan entamé ce
  jour-là. Voir « Journal du 2026-08-27 (suite 2) » plus bas. Committé et
  poussé (commits `6392f7b`, `37aa153`).
- **Dernier jour du plan entièrement terminé et vérifié en conditions
  réelles : Jour 14** (templates par département + historique, backend et
  frontend) — voir « Journal du 2026-08-25 (suite 3) » ci-dessous. Complété
  le même jour par le **sélecteur de template dans « Générer un
  scénario »** (« Journal du 2026-08-25 (suite 4) ») — la boucle
  création → réutilisation d'un modèle est désormais bouclée de bout en
  bout.
- **Session du 2026-08-25 mise en pause ici**, à la demande de
  l'utilisateur. Tout le travail listé ci-dessus est committé et poussé
  (dernier commit `cf1796e`), arbre de travail propre. Deux présentations
  PowerPoint ont aussi été produites ce jour-là dans
  `docs/presentations/` (gitignorées, non commitées) :
  `H-SHIELD237_avancement_jour13.pptx` (rapport PDF + gouvernance
  renforcée) et `H-SHIELD237_avancement_jour14.pptx` (templates +
  historique + sélecteur). **Prochaine étape à la reprise : Jour 15**
  (vérification de fidélité visuelle) — voir « Prochaine action
  précise » tout en bas de ce document.
- Entre les jours 13 et 14, une **refonte de la gouvernance du
  consentement** a aussi été faite et vérifiée (2026-08-25, hors plan des
  20 jours, demande directe de l'utilisateur) — voir « Journal du
  2026-08-25 (suite) ». Registre des responsables par département géré
  par l'administrateur, génération automatique de la demande de
  consentement, refus justifié par motifs, bouton « Lancer » désactivé
  sans validation.
- **Dernier jour du plan avant cela, également terminé et vérifié : Jour 12**
  (score de vulnérabilité + Tableau de bord/Résultats connectés aux données
  réelles) — voir « Journal du 2026-08-22 » ci-dessous.
  - ✅ Backend fait : `GET /api/campagnes/{id}/score/` et
    `GET /api/campagnes/departements/score/` (taux ouverture/clic/soumission/
    signalement + score composite 0-100), 5 tests (21/21 au total).
  - ✅ Frontend fait : `DashboardPage.jsx` reconstruite avec les vraies
    données (métriques, comparatif par département, jauge de score,
    campagnes récentes) ; nouvelle page `Resultats/ResultatsPage.jsx`
    (classement des départements, tableau détaillé, filtre par campagne
    individuelle) ; route `/resultats` câblée.
  - ✅ **Committé et poussé** (commit `6a16889`).
- Jour 11 (consentement obligatoire + journal d'audit, première étape de la
  Phase 3) reste entièrement terminé, vérifié, **committé et poussé**
  (commits `598bfeb`, `ccafa61`, `59bc4e2`, `e871419`) — la simplification
  post-Jour-11 (retrait du ciblage multi-département de l'interface, champs
  expéditeur/destinataire communs aux deux modes de génération) a été
  committée le même jour que sa demande.
- Jour 10 (segmentation par département) reste entièrement terminé, vérifié,
  **committé et poussé** (commit `8ffc128`).
- Jour 9 (modèle `Interaction`, pixel, tracking clic/soumission) reste
  entièrement terminé, vérifié, **committé et poussé** (commits `7247586`,
  `7ed1a2c`, `9b0cd10`).
- Jour 8 (envoi SMTP, expéditeur configurable, fausse page de capture) reste
  entièrement terminé, vérifié, **committé et poussé** (commits `0630615`,
  `7d7d8d0`).
- Jalon 1 (jour 5) et **Jalon 2 (jour 10) : atteints.**
- **Jour 13 (rapport PDF) : ✅ entièrement terminé (backend + frontend),
  vérifié en conditions réelles (navigateur), committé et poussé.**
  Phase 3 du sprint (« Gouvernance & résultats », jours 11-15) : **en
  cours** — jours 11, 12 et 13 terminés ; jour 14 (templates sectoriels,
  historique) pas encore démarré.
  - Backend (commit `c88aa61`) : `apps/rapports/` (`GenerationRapportService`
    + WeasyPrint) expose `GET /api/campagnes/{id}/rapport/` ; 25/25 tests
    passent ; endpoint testé en direct via curl (PDF réel de 13 Ko,
    `Content-Type: application/pdf`).
  - Frontend (commit `43ffcb4`) : `RapportsPDFPage.jsx` — liste des
    campagnes (adaptée au modèle réel : une campagne par département,
    pas d'entreprises multiples), aperçu du score au clic (jauge +
    barres de taux), téléchargement du PDF à la demande via blob.
    Vérifié avec un navigateur réel (Puppeteer piloté sur Chrome
    installé localement) : aucune erreur console, rendu fidèle à la
    charte, flux complet connexion → sélection → téléchargement
    fonctionnel de bout en bout (toast de succès affiché). Voir
    « Journal du 2026-08-25 ».

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

### Jour 10 — segmentation des campagnes par département

1. **Modèle `Destinataire`** (`apps.campagnes`, migration `0004`) : `email`
   + `departement`, rattaché à une `Campagne`. Représente la vraie liste de
   destinataires d'une campagne (contrairement à `ScenarioPhishing.destinataire_email`,
   qui reste un simple email de test — voir écart n°7).
2. **`ScenarioPhishing.departements_cibles`** : `ArrayField` de départements
   ciblés par ce scénario au sein de sa campagne. Vide = scénario générique
   de repli.
3. **`EnvoiCampagneService` adapté** : quand une campagne possède des
   `Destinataire`, chacun reçoit automatiquement le scénario ciblant son
   département (ou le scénario générique à défaut) ; erreur claire si ni
   l'un ni l'autre n'existe. Le comportement des jours 8-9 (liste d'emails
   explicite ou email de test par scénario) reste intact pour compatibilité.
4. **Endpoints** `GET/POST /api/campagnes/{id}/destinataires/` et
   `DELETE /api/campagnes/{id}/destinataires/{id}/`.
5. **Frontend** : sélecteur de départements ciblés (chips) sur la page
   « Générer un scénario » (commun aux modes API et manuel) ; nouvelle
   section « Destinataires par département » dans la modale de lancement de
   campagne (ajout/liste/suppression), alimentant directement le nouveau
   comportement d'envoi.
6. **3 nouveaux tests** (`apps/simulation/tests.py`, `SegmentationDepartementTests`) :
   sélection correcte par département, erreur si aucun scénario ne
   correspond, repli sur le scénario générique. Total : 6/6 tests OK.
7. **Vérification réelle complète** : `POST /api/generation/manuel/` avec
   `departements_cibles` confirmé persistant ; endpoints `Destinataire`
   testés en conditions réelles (`201`/`200`/`204`).

**Jalon 2 atteint** : fin de la Phase 2 du sprint. Jour 10 committé et
poussé sur GitHub (commit `8ffc128`). Les 4 services Docker sont `healthy`.

## Journal du 2026-08-21 (Jour 11 — consentement, journal d'audit)

### Jour 11 — gouvernance

1. **Backend `apps/gouvernance/`** : modèles `Consentement` (campagne
   OneToOne, responsable_nom/email, statut [en_attente/valide/refuse],
   date_validation) et `JournalAudit` (action, auteur FK, horodatage,
   details JSONField).
2. **Blocage explicite du lancement** : `EnvoiCampagneService.__init__`
   refuse tout envoi tant qu'aucun `Consentement` au statut « valide »
   n'existe pour la campagne (`EnvoiCampagneError`).
3. **Validation authentifiée depuis l'application** (décision explicite de
   l'utilisateur) : seul l'utilisateur connecté avec le rôle **Responsable**
   *et* dont l'email correspond exactement à `responsable_email` peut
   valider ou refuser — jamais une simple déclaration du consultant. Chaque
   validation/refus crée une entrée `JournalAudit`.
4. **Endpoints** : création/consultation de la demande par campagne, liste
   filtrable (visible entièrement par consultant/administrateur, restreinte
   aux demandes propres pour un responsable — voir écart n°22), validation,
   refus, lecture du journal d'audit (administrateurs).
5. **Frontend** : `ConsentementsPage.jsx` (fidèle à la maquette) — 4 cartes
   métriques, recherche/filtres par statut, actions Valider/Refuser visibles
   uniquement pour le responsable désigné connecté, modale de nouvelle
   demande. Route `/consentements` câblée dans `App.jsx`.
6. **Bug trouvé et corrigé** : `ConsentementSerializer` exigeait le champ
   `campagne` en entrée alors qu'il est fourni par la vue — bloquait toute
   création de demande (`400`). Corrigé en l'ajoutant à `read_only_fields`.
7. **10 nouveaux tests** (`apps/gouvernance/tests.py`) : blocage sans
   consentement/en attente/refusé, autorisation après validation, validation
   par le bon responsable, rejet par un autre responsable ou un rôle non
   responsable, visibilité de la liste par rôle. Total : 16/16 tests OK.
8. **Vérification réelle complète** : flux `400` (bloqué) → création demande
   → validation par le responsable (`200`) → nouveau lancement → `201`
   (réussi), avec entrées `JournalAudit` confirmées en base.

### Ajustements demandés après coup (même jour)

9. **Modale « Nouvelle campagne » simplifiée** : seul le département ciblé
   reste sélectionnable — les champs Statut initial et Périmètre validé ont
   été retirés (l'utilisateur les jugeait inutiles à la création).
10. **Transitions automatiques statut/périmètre validé**, sur demande
    explicite de l'utilisateur : création → `en_attente` / non validé ;
    validation du consentement par le responsable → `en_attente` (inchangé)
    / validé (`ConsentementValiderView` met désormais aussi à jour
    `Campagne.perimetre_valide`) ; lancement réussi → `active` / validé
    (déjà fait par le frontend, désormais explicite avec
    `perimetre_valide: true`).
11. **Bug corrigé : affichage utilisateur figé après reconnexion**.
    `LoginPage` récupérait un nouveau token JWT mais n'informait jamais
    `AuthContext` — l'ancien utilisateur restait affiché en mémoire.
    Corrigé en appelant `refresh()` du contexte après connexion (et à la
    déconnexion, par précaution).
12. **Préremplissage expéditeur dans la modale de lancement**. Nouvel
    endpoint `GET /api/campagnes/{id}/scenarios/` (`ScenarioListView`,
    liste du plus récent au plus ancien). La modale de lancement préremplit
    désormais le nom/email de l'expéditeur affiché à partir du dernier
    scénario généré (sans écraser une configuration déjà saisie), et
    suggère l'email de test comme premier destinataire si la liste est vide.

Jour 11 committé et poussé sur GitHub le même jour (commits `598bfeb`,
`ccafa61`). Note opérationnelle : `frontend`/`nginx` n'avaient pas redémarré
depuis l'arrêt complet de la veille — redémarrés en début de session avec
`docker compose up -d`. Un aléa réseau ponctuel (`401 Unauthorized` du
registre Docker Hub sur `node:20-alpine`) a fait échouer un rebuild frontend
sans lien avec le code — résolu par une simple relance.

### Simplification demandée après le Jour 11 (même jour)

Retour utilisateur après usage réel de la page Générer un scénario : les
adresses de diffusion (listes de distribution) existent déjà pour joindre
tout un groupe d'un coup, et une campagne cible déjà un seul département —
le ciblage multi-département par scénario n'a donc pas d'utilité pratique.

1. **Retiré de l'interface** : le sélecteur « Départements ciblés » (chips)
   sur la page Générer un scénario, et la section « Destinataires par
   département » (liste + ajout/suppression) dans la modale de lancement de
   campagne. **Le backend n'a pas été modifié** : le modèle `Destinataire`,
   ses endpoints, et `ScenarioPhishing.departements_cibles` existent
   toujours (voir écart n°28) — simplement plus atteignables depuis
   l'interface. `EnvoiCampagneService` retombe donc systématiquement sur
   son chemin de repli (email de test/diffusion du scénario), déjà
   rétrocompatible depuis le jour 10.
2. **Champs Expéditeur et destinataire déplacés hors du mode manuel** :
   affichés désormais pour les deux modes de génération (API et manuel) sur
   la page Générer un scénario, avec validation de format identique dans
   les deux cas. `GenerationAPIRequestSerializer` accepte maintenant
   `expediteur_nom`/`expediteur_email`/`destinataire_email` à la place de
   `departements_cibles`.
3. **Vérification réelle** : 16/16 tests toujours au vert (aucun modèle
   backend touché) ; `POST /api/generation/api/` testé avec les nouveaux
   champs → `503` attendu (clé Anthropic invalide), sans aucune erreur de
   validation sur les champs — confirme que le serializer les accepte
   correctement ; `/generer-scenario` et `/campagnes` → `200`.
4. **Aléa Docker Desktop** : un rebuild a échoué avec une erreur interne
   (`NotFound: forwarding Ping: no such job`, probablement buildx) sans
   rapport avec le code — résolu par une simple relance, comme les
   précédents incidents de ce type.

Les 4 services Docker sont `healthy`. Cette simplification a été committée
et poussée le jour même (commits `59bc4e2`, `e871419`).

## Journal du 2026-08-22 (Jour 12 — score de vulnérabilité, tableau de bord, résultats)

### Jour 12 — backend

1. **Service de calcul** (`backend/apps/campagnes/services.py`, nouveau) :
   `calculer_score(envois_qs)` calcule, à partir d'un queryset
   `EnvoiTracking`, les taux d'ouverture/clic/soumission/signalement (comptés
   par envoi distinct, pas par événement brut — un pixel rechargé plusieurs
   fois ne fait pas dépasser 100 %) et un score composite pondéré :
   `0.5×soumission + 0.3×clic + 0.2×ouverture − 0.3×signalement`, borné à
   [0, 100]. Le signalement fait donc **baisser** le score plutôt que
   l'augmenter — décision explicite pour refléter la vigilance réelle de
   l'employé.
2. **`score_campagne(campagne)`** agrège sur `campagne.scenarios.all()` —
   fonctionne correctement même si la campagne possède plusieurs scénarios
   par département (jour 10), sans avoir besoin de connaître le détail de
   cette segmentation.
3. **`score_par_departement()`** agrège, pour chacun des 10 départements
   possibles, toutes les campagnes et tous les scénarios de ce département —
   utilisé par le tableau de bord global. Retourne toujours les 10
   départements (même sans aucune campagne), avec `total_envois: 0` et
   `score_vulnerabilite: 0.0` pour ceux qui n'ont encore rien reçu.
4. **Endpoints** `GET /api/campagnes/{id}/score/` (`CampagneScoreView`) et
   `GET /api/campagnes/departements/score/` (`ScoreParDepartementView`),
   réservés aux rôles consultant/administrateur (`CAN_MANAGE_CAMPAGNE`,
   cohérent avec le reste de `apps.campagnes`).
5. **5 nouveaux tests** (`backend/apps/campagnes/tests.py`, nouveau fichier) :
   score à zéro sans aucun envoi, agrégation correcte sur plusieurs
   scénarios/départements avec des combinaisons d'interactions variées,
   bornage du score à 100 même si tous les destinataires soumettent, une
   entrée par département avec agrégation multi-campagnes, complétude des
   10 départements dans la réponse. Total : **21/21 tests OK**.
6. **Vérification réelle complète** : `GET .../departements/score/` → `200`
   avec les 10 départements (dont un montrant 2 campagnes réelles créées
   plus tôt dans le sprint) ; `POST /api/campagnes/` puis
   `GET .../score/` sur la campagne créée → `200`, `score_vulnerabilite: 0.0`
   comme attendu (aucun envoi).

### Jour 12 — frontend

7. **`DashboardPage.jsx` reconstruite** (elle n'était qu'un texte provisoire
   depuis le jour 3) : 4 cartes de métriques (campagnes actives, emails
   envoyés, taux de clic moyen, score de vulnérabilité — colorées selon le
   seuil de risque), comparatif « Vulnérabilité par département » (barres
   horizontales), jauge SVG du score global (`ScoreRing`, nouveau composant
   réutilisable), tableau des 5 campagnes les plus récentes. Bandeau
   d'alerte automatique si un département testé atteint un score ≥ 50.
8. **Nouvelle page `Resultats/ResultatsPage.jsx`** (route `/resultats`,
   jusqu'ici sans page réelle) : sélecteur « Toutes les campagnes / une
   campagne précise » ; en vue globale, deux onglets — « Vue globale »
   (jauge de score, comportements observés en barres indépendantes,
   classement des départements) et « Par département » (tableau détaillé
   avec puce de niveau de risque) ; en vue campagne précise, une carte de
   détail isolée pour cette seule campagne.
9. **Nouveaux fichiers** : `frontend/src/api/scores.js` (`getScoreCampagne`,
   `getScoreParDepartement`), `frontend/src/utils/score.js` (seuils de
   risque, agrégation pondérée par département — voir écart n°29),
   `frontend/src/components/ScoreRing.jsx` (jauge SVG réutilisable).
10. **Écart n°30 — adaptation explicite du contenu de la maquette** : les
    maquettes `app.html`/`resultats.html` d'origine comparaient plusieurs
    entreprises clientes par secteur d'activité (héritage du modèle
    multi-tenant abandonné au jour 6, voir écart n°1). Sur consigne
    explicite de l'utilisateur pour ce jour, tout le vocabulaire et la
    logique de comparaison ont été adaptés à la structure réelle — une
    seule entreprise, plusieurs départements internes — sans réintroduire
    de notion de secteur ou d'entreprise cliente.
11. **Vérification réelle complète** : build Vite réussi (114 modules, aucune
    erreur), les 4 services Docker `healthy`, `GET /` et `GET /resultats` →
    `200` avec le bundle JS fraîchement construit, `GET .../score/` et
    `GET .../departements/score/` → `200` via nginx avec un jeton
    authentifié.
12. **Aléa Docker Desktop marqué de cette session** : plusieurs commandes
    (`docker compose build`, `docker compose up -d`, `docker ps`) ont
    ponctuellement mis plusieurs minutes à produire la moindre sortie,
    sans erreur explicite — plus lent que les incidents `401`/`buildx`
    déjà documentés les jours précédents. Un redémarrage du conteneur `db`
    a même déclenché une récupération WAL après arrêt non propre
    (`database system was not properly shut down`), résolue automatiquement
    par PostgreSQL en quelques minutes, sans aucune perte de données — le
    ralentissement semble lié à l'environnement Docker Desktop / disque de
    la machine, pas au code du projet.

Jour 12 committé et poussé sur GitHub le même jour (commit `6a16889`).

## Journal du 2026-08-23 (Jour 13 — rapport PDF, session interrompue par le réseau)

### Jour 13 — backend (écrit, non vérifié)

1. **Nouvelle app `backend/apps/rapports/`** : `GenerationRapportService`
   (utilise WeasyPrint) génère un PDF à la demande — aucun fichier n'est
   stocké, tout est recalculé à chaque appel à partir de
   `apps.campagnes.services.score_campagne` (Jour 12).
2. **Recommandations générées par règles simples** (pas d'appel LLM) : le
   texte varie selon le taux de soumission, le taux de clic et le score
   composite — ex. « formation urgente » si `taux_soumission >= 25`,
   message positif si `score_vulnerabilite < 25`, etc. Voir
   `generer_recommandations()` dans `services.py`.
3. **Endpoint** `GET /api/campagnes/{id}/rapport/` (`RapportCampagneView`),
   réservé aux rôles consultant/administrateur, retourne le PDF en
   `application/pdf` avec `Content-Disposition: attachment`.
4. **Template** `apps/rapports/templates/rapports/rapport.html` : reprend
   la charte graphique du projet (navy `#0F1F3D`, rouge `#C0392B`, etc.),
   score composite en gros caractères, barres de progression CSS pour
   chaque taux, liste de recommandations.
5. **4 tests écrits** (`apps/rapports/tests.py`) : accès refusé sans
   authentification/avec un rôle non autorisé, PDF généré même sans aucune
   donnée (`%PDF` en tête de réponse), PDF reflétant des interactions
   réelles. **Non exécutés** — voir point 7.
6. **`requirements.txt`** : ajout de `weasyprint>=61`. **`Dockerfile`** :
   ajout des bibliothèques système requises par WeasyPrint
   (`libpango-1.0-0`, `libpangoft2-1.0-0`, `libharfbuzz0b`, `libfribidi0`,
   `fonts-liberation`).
7. **Écart n°31 — `build-essential` retiré du `Dockerfile` backend**,
   décision utilisateur explicite après diagnostic : aucune dépendance du
   projet n'a besoin de compiler quoi que ce soit sur Linux/amd64
   (`psycopg[binary]` utilise déjà des wheels précompilées ; Django, DRF,
   gunicorn, anthropic, et les dépendances de WeasyPrint fournissent toutes
   des wheels). `build-essential` tirait ~40 Mo de chaîne de compilation
   C/C++ (gcc-14, g++-14…) qui échouait systématiquement au téléchargement
   pendant cette session (voir point 8). **Non encore vérifié que le build
   réussit sans lui** — c'est la toute première chose à confirmer à la
   reprise (si `pip install` échoue avec une erreur de compilation, il
   faudra le réintroduire).

### Aléa réseau bloquant (raison de l'interruption de session)

8. **Panne réseau persistante, distincte des aléas Docker Desktop déjà
   documentés les jours précédents.** Plusieurs dizaines de tentatives de
   `docker compose build backend` ont échoué : les téléchargements de
   paquets `apt` (y compris le simple index de paquets Debian, 9,6 Mo)
   restaient bloqués à 0 octet/s pendant 15 à 30 minutes, confirmé à
   plusieurs reprises par `docker stats` (aucune activité réseau/CPU sur le
   conteneur buildkit). Diagnostic mené étape par étape :
   - redémarrage du conteneur `buildx_buildkit_default` seul → débloque
     temporairement puis se reproduit ;
   - test de connectivité brut (`docker pull python:3.12-slim` sans
     buildkit) → a fini par réussir, écartant un blocage réseau total ;
   - retrait de `build-essential` (voir point 7) → réduit le volume à
     télécharger mais le blocage se reproduit sur le tout premier fichier ;
   - **redémarrage complet de Docker Desktop par l'utilisateur** → les 4
     services applicatifs sont repartis sains, `docker info` répond de
     nouveau, mais le rebuild backend s'est **rebloqué** sur le même point
     (confirmé par `docker stats` à deux reprises, 15 secondes d'écart,
     zéro octet transféré).
   - Conclusion retenue : le problème se situe au niveau de la connexion
     réseau de la machine elle-même (ou d'un pare-feu/proxy filtrant les
     transferts un peu volumineux), pas du moteur Docker Desktop — un
     redémarrage complet de Docker Desktop n'y change rien.
9. **Décision utilisateur** : mettre la session en pause plutôt que de
   continuer à relancer le build à l'aveugle. Le code du Jour 13 n'est
   **ni vérifié, ni committé, ni poussé**.

## Journal du 2026-08-24 (Jour 13, suite — diagnostic réseau précis)

Reprise de session directement sur la « Prochaine action précise » laissée
la veille. Nouvelle tentative de rebuild backend, avec le même blocage que
la veille sur `docker compose build` (téléchargements `apt` bloqués). Le
diagnostic a cette fois été poussé plus loin, avec une découverte
déterminante.

1. **`docker info` a fini par répondre** après plusieurs minutes de blocage
   en tout début de session (contrairement à la veille, pas besoin de
   redémarrer Docker Desktop) — le rebuild a donc pu être relancé.
2. **`pip install -r requirements.txt` a échoué avec une vraie erreur**,
   distincte des blocages `apt` : un conflit de dépendances impossible à
   résoudre (`ResolutionImpossible`), signalant tour à tour `asgiref` puis,
   à la tentative suivante, `Pillow` comme cause — deux diagnostics
   incohérents entre eux pour la même commande.
3. **Isolé le problème avec `pip install --dry-run`** en dehors du build
   Docker complet (plus rapide à itérer). Le passage de `weasyprint>=61` à
   une version épinglée précise (`weasyprint==62.3`) a fait disparaître les
   deux conflits « fantômes » — confirmant qu'ils n'étaient pas de vrais
   conflits de version, mais des artefacts d'une résolution instable.
4. **Cause racine identifiée** : à l'étape suivante, `pip` a rejeté un
   paquet déjà téléchargé avec une erreur explicite de hash :
   ```
   ERROR: THESE PACKAGES DO NOT MATCH THE HASHES FROM THE REQUIREMENTS FILE.
   djangorestframework-simplejwt ... :
       Expected sha256 63e7ee25ae29fa6ebdcc4502f351d1541f3e1b67bddd63a94f397627738d8408
            Got        c642709cff6fca4187458fbbbbce639cd7a783e0c3680a7cbc9a2c35f0bb73d7
   ```
   **Ce n'est donc pas un problème de dépendances ni de code** : les
   fichiers téléchargés arrivent corrompus (octets altérés en transit).
   Cela explique rétroactivement l'ensemble des incidents réseau des
   sessions précédentes (échecs `apt` avec re-téléchargements en boucle,
   `Ign:` répétés sur les mêmes paquets, conflits pip incohérents d'un essai
   à l'autre) : tous portent la signature d'une corruption de données, pas
   d'une simple lenteur ou d'un serveur distant capricieux.
5. **Hypothèse retenue** : corruption liée à un défaut de déchargement de
   somme de contrôle réseau côté machine (TCP Checksum Offload / Large Send
   Offload), un bug matériel/pilote connu qui touche parfois les adaptateurs
   Wi-Fi/Ethernet combinés à WSL2 — silencieux la plupart du temps, mais
   détecté ici uniquement parce que `pip` et `apt` vérifient activement les
   sommes de contrôle des fichiers téléchargés.
6. **`weasyprint==62.3`** (épinglage précis) conservé dans
   `requirements.txt` même après ce diagnostic — un épinglage exact reste
   une bonne pratique indépendamment du problème réseau (résolution plus
   rapide et reproductible).
7. **Décision utilisateur** : tester sur un réseau différent (partage de
   connexion mobile ou autre Wi-Fi) avant de relancer le prochain build,
   pour confirmer que le problème vient bien de l'adaptateur réseau actuel
   plutôt que d'insister sur le même réseau. Session mise en pause dans
   l'attente.

## Journal du 2026-08-25 (Jour 13, backend terminé et vérifié)

Reprise directe sur la « Prochaine action précise » du 2026-08-24. Le
réseau fonctionnait normalement dès le début de cette session (`pip
install` complet en 549 s sans aucune erreur de somme de contrôle, `apt-get
update` en 14 s à 700-1000+ kB/s) — la corruption réseau du 2026-08-24
n'a pas eu besoin d'être contournée activement, elle s'était résolue
d'elle-même.

1. **Rebuild propre confirmé** : la suppression de `build-essential` du
   `Dockerfile` (écart n°31, session précédente) est validée — `pip
   install` s'est déroulé sans compilation, tous les wheels étaient
   disponibles.
2. **Nouveau bug trouvé, distinct du problème réseau** : `python manage.py
   test` → 23/25 passent, 2 échecs dans `apps.rapports.tests` avec
   `AttributeError: 'super' object has no attribute 'transform'` dans
   `weasyprint/pdf/stream.py`. Diagnostic : `weasyprint==62.3` (épinglé la
   veille pour une raison sans rapport, voir écart n°32) est incompatible
   avec `pydyf==0.12.1` (résolu par pip car aucune contrainte de version
   n'existait sur `pydyf`), une version qui a introduit des changements
   d'API cassants. **Correctif** : `weasyprint` bump à `69.0` (dernière
   version disponible) dans `requirements.txt`.
3. **Bug cosmétique corrigé au passage** : `Fontconfig error: No writable
   cache directories` répété à chaque test — l'utilisateur non-root
   `appuser` n'a pas de `$HOME` inscriptible pour le cache de polices.
   Corrigé en ajoutant `XDG_CACHE_HOME=/app/.cache` dans le `Dockerfile`
   (+ création du dossier, déjà couvert par le `chown -R` existant).
4. **Rebuild + vérification complète après correctifs** :
   - `docker compose build backend` : succès, aucune erreur.
   - `docker compose up -d` : recréation propre du conteneur backend,
     tous les services `healthy`.
   - `python manage.py test` : **25/25 tests passent**, plus aucune
     erreur fontconfig.
   - Test en direct via `curl` (JWT obtenu via `POST
     /api/auth/login/`) : `GET /api/campagnes/24/rapport/` →
     `200 OK`, `Content-Type: application/pdf`, PDF réel de 13 136
     octets commençant par `%PDF-1.7`.
5. **Committé et poussé** (commit `c88aa61`) : `apps/rapports/`,
   `Dockerfile`, `requirements.txt`, `settings/base.py`, `urls.py`. Le
   `git push` a de nouveau connu un ralentissement ponctuel (timeout à
   60 s) mais a abouti en relançant la commande — cohérent avec un réseau
   redevenu globalement fiable mais pas parfaitement stable.
6. **Jour 13 frontend** : `frontend/src/pages/RapportsPDF/RapportsPDFPage.jsx`
   (nouveau), `frontend/src/api/rapports.js` (nouveau,
   `downloadRapportCampagne`, `responseType: "blob"`), route `/rapports`
   câblée dans `App.jsx`, classes CSS ajoutées à `components.css`
   (`.reports-layout`, `.rapport-row`, etc.).
   - **Adaptation délibérée par rapport à `docs/maquettes/rapports.html`** :
     la maquette d'origine liste des rapports par entreprise cliente et par
     secteur (héritage du modèle multi-tenant abandonné au jour 6, voir
     écart n°1 et n°30) — remplacé par une liste de campagnes (une par
     département), cohérent avec l'adaptation déjà faite au jour 12 pour
     Tableau de bord/Résultats.
   - Sélectionner une campagne affiche un aperçu (jauge `ScoreRing` +
     barres de taux, réutilisant `getScoreCampagne` du jour 12) avant
     téléchargement — pas d'aperçu des recommandations texte (générées
     uniquement côté backend, dans le PDF lui-même).
   - Le bouton Télécharger déclenche `GET .../rapport/` en `blob`, crée un
     lien `<a download>` temporaire côté client, sans fichier stocké côté
     serveur (cohérent avec le backend, qui régénère tout à chaque appel).
   - **Vérification en navigateur réel** (pas seulement via curl, comme
     demandé) : script Puppeteer piloté sur le Chrome déjà installé sur la
     machine (installation temporaire de `puppeteer-core` dans le
     répertoire scratchpad, hors du dépôt) — connexion réelle, capture
     d'écran de la liste et de l'aperçu, clic sur « Télécharger le PDF » :
     aucune erreur console, toast de succès affiché, confirmant que
     l'appel API et le flux de téléchargement fonctionnent bout en bout.
   - **Aléa Docker Desktop rencontré** : le premier `docker compose build
     frontend` a échoué avec `DeadlineExceeded` en résolvant les métadonnées
     des images de base, et le conteneur `buildx_buildkit_default` s'est
     retrouvé `Exited` — résolu par une simple relance de `docker compose
     build`, cohérent avec les aléas buildx déjà documentés (écart
     « Bugs connus »).
   - **Committé et poussé** (commit `43ffcb4`).

**Jour 13 est donc entièrement terminé (backend + frontend), vérifié en
conditions réelles, committé et poussé.** Prochaine étape : **Jour 14**
(templates sectoriels + historique des campagnes).

## Journal du 2026-08-25 (suite) — refonte de la gouvernance du consentement

Demande directe de l'utilisateur, hors plan des 20 jours, après le Jour 13 :
trois changements liés au cadre de gouvernance (module `apps.gouvernance`,
Jour 11), fondés sur trois principes de sécurité — le responsable qui
valide une campagne ne doit plus être désigné par la personne qui crée la
campagne, un refus doit être justifié, et le lancement doit être
visuellement impossible tant que le consentement n'est pas validé.

### 1. Registre des responsables par département (nouveau)

1. **Nouveau modèle `ResponsableDepartement`** (`apps/gouvernance/models.py`,
   migration `0002`) : un seul responsable par département
   (`departement` unique), `nom`, `email`. Géré exclusivement par
   l'administrateur (`IsAdministrateur`) via `GET/POST
   /api/gouvernance/responsables/` et `PATCH/DELETE
   /api/gouvernance/responsables/<id>/`.
2. **`Consentement.responsable_nom`/`responsable_email` ne sont plus
   jamais saisis par le client** — passés en `read_only_fields` dans
   `ConsentementSerializer`. Ils sont désormais toujours dérivés du
   registre côté serveur (`apps/gouvernance/services.py`,
   `creer_consentement_auto`).
3. **Génération automatique à la création de la campagne** :
   `CampagneViewSet.perform_create` (`apps/campagnes/views.py`) appelle
   `creer_consentement_auto(campagne)` juste après la sauvegarde — si un
   responsable est configuré pour le département de la campagne, la
   demande de consentement est créée immédiatement, au statut « en
   attente », sans aucune action supplémentaire du consultant.
4. **Écart n°36 — la personne qui crée une campagne ne désigne plus le
   responsable qui doit la valider**, changement de sécurité explicite
   demandé par l'utilisateur : auparavant, `ConsentementsPage.jsx`
   proposait un formulaire libre (nom + email) pour n'importe quel
   consultant/administrateur à la création de la demande — un consultant
   aurait pu, par erreur ou intentionnellement, désigner n'importe quelle
   adresse email comme « responsable », contournant le contrôle. Ce
   formulaire a été **entièrement retiré** de `ConsentementsPage.jsx`.
5. **Filet de sécurité pour les départements sans responsable configuré
   au moment de la création** : `POST
   /api/gouvernance/campagnes/<id>/consentement/` reste disponible mais
   **restreint à l'administrateur uniquement** (`get_permissions()` sur
   `ConsentementCampagneView`, GET reste accessible à
   consultant/administrateur) — il dérive toujours le nom/email depuis le
   registre (jamais depuis le corps de la requête, testé explicitement,
   voir `GenerationManuelleConsentementTests.test_ignore_les_valeurs_du_corps_de_la_requete`)
   et renvoie `400` si le département n'a toujours aucun responsable
   configuré. Section « Campagnes sans demande de consentement »
   ajoutée à `ConsentementsPage.jsx` (visible administrateur uniquement),
   listant les campagnes sans consentement (diff client-side entre
   `listCampagnes` et `listConsentements`) avec un bouton « Générer la
   demande ».
6. **Nouvelle page frontend `Responsables/ResponsablesPage.jsx`**
   (route `/responsables`, lien de nav réservé à l'administrateur — voir
   point 8) : tableau des 10 départements, chacun affichant son
   responsable configuré ou « Non configuré », avec ajout/modification/
   suppression via une modale simple (nom + email).
7. **Compte de test créé** : `administrateur@hshield237.local` /
   `Administrateur1234!` (rôle administrateur) — n'existait pas
   auparavant (l'ancien `admin@hshield237.local` a le rôle `employe`,
   nom historique trompeur, non modifié pour ne pas casser d'éventuel
   usage existant — voir « Bugs connus »/« Comptes de test »).
8. **Navigation filtrée par rôle** (nouveauté, `Sidebar.jsx` +
   `navConfig.js`) : les entrées de `NAV_SECTIONS` acceptent désormais un
   champ optionnel `roles` (tableau) ; une section entière disparaît si
   plus aucun de ses items n'est visible pour le rôle courant. Seul
   l'item « Responsables » utilise ce filtre pour l'instant
   (`roles: ["administrateur"]`).

### 2. Justificatif de refus obligatoire

9. **`Consentement.motifs_refus`** (`ArrayField`, choix `MotifRefus` :
   périmètre trop large / timing inapproprié / scénario inadapté /
   informations insuffisantes / autre) et **`motif_refus_details`**
   (texte libre, obligatoire uniquement si « Autre » est coché).
10. **`ConsentementRefuserView.post`** exige désormais au moins un motif
    valide dans `motifs` (`400` sinon) et un texte non vide dans
    `details` si `autre` est présent parmi les motifs cochés. Les motifs
    et le texte sont journalisés dans `JournalAudit`.
11. **Frontend** : la simple `window.confirm()` a été remplacée par une
    vraie modale (`ConsentementsPage.jsx`) avec cases à cocher pour
    chaque motif prédéfini + un champ texte pour « Autre » ; les motifs
    et le texte libre sont affichés sur la ligne du consentement refusé
    (liste à puces + citation).

### 3. Bouton « Lancer » désactivé sans consentement validé

12. **Écart n°37 — gap comblé** : jusqu'ici, `CampagnesPage.jsx` ne
    vérifiait jamais `campagne.perimetre_valide` côté frontend avant
    d'ouvrir la modale de lancement — seul le backend refusait l'envoi
    (`400`), après que l'utilisateur ait déjà rempli tout le formulaire
    d'expéditeur. Corrigé : le bouton « Lancer » (icône avion en papier)
    est maintenant visuellement désactivé (`.action-btn.disabled`,
    opacité réduite, `cursor: not-allowed`) et son clic ignoré tant que
    `perimetre_valide` est `false`, avec une info-bulle explicite («En
    attente de validation du responsable désigné»).

### Vérification réelle complète

13. **Backend** : 39/39 tests passent (13 nouveaux : registre des
    responsables — CRUD et permissions admin-only —, création
    automatique du consentement à la création d'une campagne via l'API,
    génération manuelle admin-only dérivant toujours du registre, refus
    avec/sans motif). Un test préexistant
    (`test_refus_par_le_bon_responsable`) a dû être adapté pour fournir
    un motif, la nouvelle exigence de justification le faisant échouer
    autrement.
14. **Frontend, en navigateur réel** (Puppeteer/Chrome, comme pour le
    Jour 13) : administrateur configure un responsable pour le
    département Informatique → création d'une campagne pour ce
    département → demande de consentement visible immédiatement dans
    Consentements avec le bon nom/email, sans aucune saisie manuelle →
    bouton Lancer confirmé grisé (`action-btn disabled`) sur la nouvelle
    campagne, actif sur une campagne déjà validée → connexion avec le
    compte responsable → refus avec motif « Le moment choisi n'est pas
    approprié » → motif affiché correctement sur la ligne refusée,
    compteurs mis à jour. Aucune erreur console (une paire de `403` sur
    `/api/campagnes/` et `/api/campagnes/departements/score/` isolée et
    confirmée **préexistante, sans lien** : la page Tableau de bord
    (racine `/`) n'a jamais été accessible au rôle responsable, qui y
    atterrit brièvement après connexion avant toute redirection
    manuelle — hors périmètre de cette session).

## Journal du 2026-08-25 (suite 2) — Jour 14 backend (templates par département)

Prompt du plan suivi presque littéralement, avec l'adaptation demandée
explicitement par l'utilisateur : remplacer « secteur » par
« département » partout, y compris dans le nom.

1. **Écart n°38 — renommage `templates_sectoriels` → `templates_departement`,
   `TemplateSectoriel` → `TemplateDepartement`**, décision utilisateur
   explicite (« si tu vois qu'il faut changer de nom tu le fais »). Le
   plan d'origine imaginait plusieurs entreprises clientes de secteurs
   différents (modèle abandonné au jour 6, écart n°1) ; le champ
   `secteur` du modèle prévu par le plan n'avait donc plus de sens dans
   la structure réelle (une entreprise, plusieurs départements). Nommage
   cohérent avec le reste du projet (`ResponsableDepartement`,
   `score_par_departement`).
2. **Nouvelle app `apps/templates_departement/`** : modèle
   `TemplateDepartement` (`nom`, `departement`, `prompt_structure`,
   `nombre_utilisations`, `date_creation`). CRUD via `ModelViewSet`
   (`/api/templates-departement/`), permissions `IsConsultant\|IsAdministrateur`
   (identique à `CampagneViewSet`), filtrable par `departement`
   (`DjangoFilterBackend`). `nombre_utilisations` en lecture seule côté
   API — incrémenté uniquement par le service de génération, jamais
   modifiable directement par le client (testé explicitement).
3. **`ClaudeGenerationService` modifié** pour accepter un `template`
   optionnel : `_build_prompt()` insère la `prompt_structure` du template
   dans le prompt envoyé à Claude avec l'instruction explicite de
   l'adapter (pas de la reprendre telle quelle — un template n'est
   qu'une base, pas un email prêt à l'emploi). `GenerationAPIView`
   accepte un `template_id` optionnel (`GenerationAPIRequestSerializer`)
   et incrémente `nombre_utilisations` après une génération réussie.
   Mode manuel (`GenerationManuelView`) non concerné — le plan ne
   mentionne que « le service de génération », entendu comme le service
   Claude spécifiquement.
4. **Endpoint d'historique par département** — écart n°39, adaptation du
   plan (formulation d'origine : « historique par entreprise ») à la
   structure réelle, comme déjà fait aux jours 6/12. `GET
   /api/campagnes/departements/historique/` (nouvelle fonction
   `historique_par_departement()` dans `apps.campagnes.services`) :
   contrairement à `score_par_departement()` (jour 12, un seul chiffre
   agrégé), retourne pour chaque département la liste chronologique de
   ses campagnes avec le score de chacune — permet d'afficher une
   évolution dans le temps, pas juste un instantané. Réutilise
   entièrement `calculer_score()` existant, aucune nouvelle logique de
   calcul.
5. **Vérification réelle complète** : 51/51 tests passent (12 nouveaux :
   5 CRUD `templates_departement` incluant permissions et filtre par
   département, 4 génération-avec-template dans un nouveau
   `apps/generation/tests.py` — API Claude simulée avec `unittest.mock`,
   `ANTHROPIC_API_KEY` restant un placeholder invalide en dev — 3
   historique-par-département). Migration écrite à la main puis validée
   par `makemigrations --check --dry-run` → « No changes detected ».
   Endpoints testés en direct via `curl` : création d'un template,
   listing, et `.../departements/historique/` retournant les 10
   départements avec la bonne structure chronologique.
6. **Aléa Docker rencontré et résolu seul** : après le rebuild, le
   conteneur backend est resté quelques minutes en `health: starting`
   avec des `WORKER TIMEOUT`/`SIGKILL` dans les logs gunicorn — ralentissement
   Docker Desktop déjà documenté à plusieurs reprises (jours 9, 12, 13),
   pas un problème de code : résolu de lui-même sans intervention,
   confirmé par un `GET /api/health/` direct réussi juste après.
7. **Backend uniquement** — le prompt de ce tour ne contenait pas de
   section FRONTEND (contrairement aux jours précédents où les deux
   étaient données ensemble). **La page Templates départements/l'historique
   ne sont pas encore câblés côté React** — le lien de nav « Templates
   sectoriels » (à renommer aussi) pointe toujours vers une route non
   câblée. Prochaine étape logique mais pas encore demandée
   explicitement.

## Journal du 2026-08-25 (suite 3) — Jour 14 frontend (Templates + Historique)

Demande explicite : connecter les deux pages du plan aux endpoints du
Jour 14 backend. Adaptation des deux maquettes d'origine (`templates.html`,
`historique.html`), qui imaginaient plusieurs entreprises clientes de
secteurs différents avec des données très riches (variables `{{}}`
substituées, aperçu d'email simulé, statistiques par template, top
scénarios, recommandations IA) — cohérent avec les adaptations déjà faites
aux jours 12/13, tout ce qui n'a pas d'équivalent réel dans les endpoints
du Jour 14 backend a été omis plutôt que fabriqué (voir écart n°30).

1. **Page `TemplatesDepartement/TemplatesDepartementPage.jsx`** (route
   `/templates`, lien de nav renommé « Templates par département ») :
   navigation par département (10 + « Tous », avec compteur par
   département), grille de cartes (nom, département, aperçu de la
   structure de prompt, nombre d'utilisations, date), modale unique de
   création/édition (nom, département, structure de prompt), suppression
   avec confirmation. **Retiré par rapport à la maquette** (fonctionnalités
   fictives sans équivalent backend) : variables `{{}}` substituées,
   onglets Prévisualisation/Statistiques/Variables disponibles, taux de
   clic par template, dupliquer/archiver.
2. **Page `Historique/HistoriquePage.jsx`** (route `/historique`, lien de
   nav déjà présent, maintenant câblé) : timeline chronologique de toutes
   les campagnes (regroupées par mois, comme la maquette), calculée en
   aplatissant la réponse de `.../departements/historique/` ; panneau de
   détail (score, barres ouverture/clic/soumission/signalement) avec un
   vrai bouton « Rapport PDF » qui **réutilise directement
   `downloadRapportCampagne` du Jour 13** (`api/rapports.js`) — intégration
   concrète entre deux jours du plan, pas juste un bouton décoratif.
   Graphique « Évolution mensuelle » calculé à partir du score de
   vulnérabilité moyen réel des campagnes testées, regroupées par mois de
   création. **Retiré par rapport à la maquette** : filtre par entreprise
   (n'existe plus), section « Scénarios les plus efficaces » et
   encadré « Recommandation IA » (aucune donnée de ce type renvoyée par
   l'endpoint — aurait fallu inventer des chiffres).
3. **Nouveaux fichiers** : `api/templatesDepartement.js`, `api/historique.js`
   ; classes CSS ajoutées à `components.css` (`.tpl-layout`, `.tpl-grid`,
   `.tpl-card*`, `.dept-nav-item`, `.hist-layout`, `.timeline-month`,
   `.tl-*`, `.evo-card`, `.mini-bar-chart`, `.mbc-*`, `.detail-panel`,
   `.detail-*`, `.d-*`, `.badge-accent`).
4. **Aléa Docker rencontré et résolu par un redémarrage ciblé** : pendant
   la vérification en navigateur réel, le backend est resté bloqué en
   boucle `WORKER TIMEOUT`/`SIGKILL` (la connexion restait indéfiniment sur
   « Connexion en cours… ») — même symptôme déjà documenté plusieurs fois
   ce sprint (jours 9, 12, 13, Jour 14 backend). Contrairement aux fois
   précédentes où le problème s'est résolu tout seul en patientant, cette
   fois un simple `docker compose restart backend` a suffi à débloquer
   immédiatement les workers (connexion revenue à 0,8 s) — sans perte de
   données, alternative plus rapide à retenir si le symptôme se reproduit.
5. **Vérification réelle complète en navigateur** (Puppeteer/Chrome,
   comme les jours précédents) : création d'un template depuis la page
   Templates → apparaît immédiatement dans la bonne colonne département ;
   page Historique → campagnes réelles affichées group par mois avec les
   bons taux ; clic sur une campagne → panneau de détail correct ; clic
   sur « Rapport PDF » → confirmé par requête réseau directe
   `GET /api/campagnes/27/rapport/` → `200`. Aucune erreur console sur
   les deux pages.
6. **Non fait dans ce tour, hors périmètre de la demande explicite** :
   la page Générer un scénario ne propose pas encore de sélectionner un
   template existant au moment de la génération par IA — le backend le
   permet déjà (Jour 14 backend, champ `template` optionnel), mais
   `GenererScenarioPage.jsx` n'a pas été touché. Prochaine étape
   logique si demandée.

## Journal du 2026-08-25 (suite 4) — sélecteur de template dans « Générer un scénario »

Demande explicite de suite directe au Jour 14 : combler le point 6
ci-dessus.

1. **`GenererScenarioPage.jsx`** : nouveau champ « Template de départ
   (optionnel) » dans l'étape 1 du formulaire, visible uniquement en mode
   API (le mode manuel ne passe jamais par `ClaudeGenerationService`,
   donc un template n'a pas de sens pour lui). La liste se recharge
   automatiquement (`listTemplates(departement)`) à chaque changement de
   campagne sélectionnée, filtrée sur le département de cette campagne —
   et le choix de template est réinitialisé à chaque fois pour ne
   jamais proposer un template d'un autre département. Option par défaut
   « Aucun — scénario libre » ; texte adapté si aucun template n'existe
   encore pour ce département. Un indice s'affiche sous le menu une fois
   un template choisi, pour rappeler qu'il sera adapté, pas repris tel
   quel (cohérent avec le prompt réel côté backend).
2. **`api/generation.js`** : `generateViaAPI` transmet désormais
   `template` (id ou `null`) au backend, qui l'utilise déjà depuis le
   Jour 14 (`GenerationAPIView` incrémente `nombre_utilisations` du
   template après une génération réussie).
3. **Aucun changement backend nécessaire** — le champ `template` de
   `GenerationAPIRequestSerializer` existait déjà et n'était simplement
   pas exploité côté frontend.
4. **Vérification réelle en navigateur** (Puppeteer/Chrome) : campagne
   de test créée pour le département Comptabilité (aucune campagne de ce
   département n'existait encore) → sélecteur affiche bien les deux
   templates déjà configurés pour Comptabilité (« Facture fournisseur »,
   « Facture fournisseur en retard », 0× utilisé chacun) → sélection
   d'un template affiche l'indice attendu. Aucune erreur console. La
   génération réelle via l'API Claude n'a pas pu être testée de bout en
   bout (clé `ANTHROPIC_API_KEY` toujours un placeholder invalide en
   dev, voir « Variables d'environnement ») — l'incrémentation de
   `nombre_utilisations` reste couverte par les tests automatisés
   backend du Jour 14 (`apps/generation/tests.py`, appel Claude simulé).

## Modules implémentés

### Backend (`backend/apps/`)

| App | État | Détail |
|---|---|---|
| `accounts` | ✅ Fait | Modèle `Utilisateur` (AbstractUser + `role`), JWT (login/refresh/me), permissions `IsConsultant`/`IsResponsable`/`IsAdministrateur` |
| `entreprises` | ❌ **Supprimée** | Retirée au jour 6 — voir « Décisions et écarts » |
| `campagnes` | ✅ Fait | Modèles `Campagne`, `ScenarioPhishing` (+ `piece_jointe`, `departements_cibles`) et `Destinataire` (email + département, jour 10), ViewSet CRUD, endpoints destinataires, filtres statut/departement, pagination, fixture de test. **`Destinataire` et `departements_cibles` ne sont plus utilisés par le frontend depuis le 2026-08-21** (voir écart n°28) mais restent fonctionnels côté API. **Jour 12** : `services.py` (calcul du score), endpoints `.../score/` et `.../departements/score/`, `tests.py` (5 tests). **Jour 14** : `services.historique_par_departement()`, endpoint `.../departements/historique/` (historique campagne par campagne, pas un seul chiffre agrégé — pour l'évolution du score dans le temps), 3 tests supplémentaires. **2026-08-27** : `CampagneSerializer` expose l'état du consentement (`consentement_statut`, motifs de refus) ; `ScenarioListView` accessible au responsable désigné pour sa propre campagne (403 sinon), 5 tests supplémentaires. `ScenarioPhishing.date_creation` ajouté (absent jusqu'ici), tri explicite du plus récent au plus ancien, 1 test supplémentaire (57 tests au total). **2026-08-27 (suite 4)** : nouveau modèle `DepartementConfigure` (registre dynamique des départements, remplace `Departement.choices`), CRUD `/api/departements/` (admin-only, suppression bloquée si utilisé), `services.departement_label()` (résolution live du libellé), 7 tests supplémentaires (64 tests au total) |
| `generation` | ✅ Fait | `ClaudeGenerationService`, endpoints `/api/generation/api/` (accepte désormais `expediteur_nom`/`expediteur_email`/`destinataire_email`, plus `departements_cibles`) et `/api/generation/manuel/` (multipart, pièce jointe) ; `ScenarioPhishing` étendu avec expediteur_nom/expediteur_email/destinataire_email/est_html |
| `simulation` | ✅ Fait (jours 8-11) | `EnvoiCampagneService` (sélection par département jour 10, **blocage sans consentement validé jour 11**), `ConfigurationEnvoi`, `EnvoiTracking`, vue publique de capture (jour 8) ; modèle `Interaction`, pixel de suivi, tracking clic/soumission (jour 9) ; `tests.py` (6 tests). **2026-08-27** : `envoyer_aux_employes(cible, employe_id)` (envoi ciblé à l'annuaire `apps.employes`, réutilise entièrement la logique d'envoi individuel déjà en place), `EnvoyerCampagneRequestSerializer` étendu, tests supplémentaires. **Manque encore** : déclencheur du type `signalement` (aucun mécanisme prévu) |
| `employes` | ✅ Fait (2026-08-27) | Modèle `Employe` (nom, email unique, département), CRUD `/api/employes/` (lecture consultant+administrateur, écriture admin-only, filtrable par département), 8 tests. Annuaire remplaçant l'adresse de diffusion pour l'envoi de campagne |
| `gouvernance` | ✅ Fait (jour 11, étendu le 2026-08-25) | Modèles `Consentement` (+ `motifs_refus`, `motif_refus_details`), `JournalAudit`, `ResponsableDepartement` (registre admin-only) ; endpoints demande (admin-only)/liste/valider/refuser (motifs obligatoires)/journal-audit/responsables (CRUD admin-only) ; `services.creer_consentement_auto` ; `tests.py` (23 tests) |
| `rapports` | ✅ Fait (jour 13 backend) | `GenerationRapportService` (WeasyPrint 69.0), endpoint `.../rapport/`, `tests.py` (4 tests). Vérifié en direct (PDF réel via curl) et committé — voir « Journal du 2026-08-25 » |
| `templates_departement` | ✅ Fait (backend + frontend, 2026-08-25) | Renommé depuis `templates_sectoriels` du plan (voir écart n°38). Modèle `TemplateDepartement` (nom, departement, prompt_structure, nombre_utilisations), CRUD `IsConsultant\|IsAdministrateur` (`/api/templates-departement/`, filtrable par département). `ClaudeGenerationService` accepte un `template` optionnel, incrémente `nombre_utilisations` à l'usage. `tests.py` (5 tests) + `apps/generation/tests.py` (4 tests, nouveau fichier). Frontend : `TemplatesDepartementPage.jsx`, route `/templates` |

### Frontend (`frontend/src/pages/`)

| Page | État | Détail |
|---|---|---|
| `Login/LoginPage.jsx` | ✅ Fait | Fidèle à `login.html`, connectée à l'API |
| `components/Layout/` | ✅ Fait | Sidebar/topbar de référence, importé par toutes les pages. **Sidebar** : bouton de déconnexion + email du compte connecté dans le pied de page, sur toutes les pages (2026-08-27, auparavant seulement sur Dashboard). **Topbar** : bouton de bascule mode sombre / mode clair (2026-08-27, `ThemeContext`), visible sur toutes les pages |
| `Dashboard/DashboardPage.jsx` | ✅ Fait (jour 12) | Métriques réelles (campagnes actives, emails envoyés, taux de clic moyen, score de vulnérabilité), comparatif par département, jauge de score (`ScoreRing`), campagnes récentes, alerte automatique si risque élevé |
| `Campagnes/CampagnesPage.jsx` | ✅ Fait | Tableau, recherche, filtres statut, pagination réelle, actions rapides, modale de création simplifiée (département uniquement, jour 11), modale de lancement (expéditeur/Reply-To/débit + avertissement DNS, jour 8 ; préremplissage expéditeur depuis le dernier scénario, jour 11). **Section « Destinataires par département » retirée le 2026-08-21** (voir journal). **2026-08-27** : bandeau d'alerte + badge rouge « Refusée » avec motifs, si le responsable a refusé la campagne. Modale de lancement : nouvelle section « Destinataires » (tous les employés du département / un employé en particulier, alimentée par l'annuaire `apps.employes`) — remplace l'ancienne absence de sélection de cible |
| `GenererScenario/GenererScenarioPage.jsx` | ✅ Fait | Sélecteur API/Manuel, formulaire adapté (département), aperçu enrichi (De/À, CTA, mode HTML), validation inline, scroll automatique (jour 7). Champs **Expéditeur/destinataire communs aux deux modes** depuis le 2026-08-21 (auparavant manuel uniquement) ; **sélecteur « Départements ciblés » retiré** le même jour. **Sélecteur de template de départ** (mode API uniquement, filtré par département de la campagne) ajouté le 2026-08-25. **2026-08-27** : suppression d'une ligne dupliquant l'objet dans l'aperçu (n'apparaît plus que dans l'en-tête) |
| `Consentements/ConsentementsPage.jsx` | ✅ Fait (jour 11, refondu le 2026-08-25) | Métriques, recherche/filtres par statut, actions Valider/Refuser réservées au responsable désigné authentifié, modale de refus avec motifs à cocher + texte libre. Plus de saisie manuelle du responsable (retirée) ; section admin-only « Campagnes sans consentement » avec génération manuelle. **2026-08-27** : bouton « Voir l'email » (responsable uniquement) ouvrant une modale d'aperçu du scénario de phishing, corrigée le même jour pour ne plus dupliquer l'objet, puis pour classer les versions par date (sélecteur, la plus récente pré-sélectionnée) quand une campagne a plusieurs scénarios |
| `Responsables/ResponsablesPage.jsx` | ✅ Fait (2026-08-25) | Registre des responsables par département, réservé à l'administrateur (page et lien de nav). Route `/responsables` |
| `Resultats/ResultatsPage.jsx` | ✅ Fait (jour 12) | Vue globale (jauge, comportements observés, classement des départements) et vue « Par département » (tableau détaillé), filtre par campagne individuelle. Route `/resultats` câblée dans `App.jsx` |
| `RapportsPDF/RapportsPDFPage.jsx` | ✅ Fait (jour 13, affiné le 2026-08-25) | Liste des campagnes (une par département), filtres par statut avec compteurs, badge de statut coloré, suppression, aperçu du score au clic (jauge + barres), téléchargement du PDF à la demande via blob. Route `/rapports` câblée dans `App.jsx` |
| `Historique/HistoriquePage.jsx` | ✅ Fait (2026-08-25) | Timeline chronologique de toutes les campagnes groupées par mois, panneau de détail (score + barres) avec téléchargement du rapport PDF (réutilise le Jour 13), graphique d'évolution mensuelle réel. Route `/historique` |
| `Departements/DepartementsPage.jsx` | ✅ Fait (2026-08-27) | Registre des départements de l'entreprise (créer/renommer/supprimer), réservé à l'administrateur (page et lien de nav). Route `/departements` |
| `Employes/EmployesPage.jsx` | ✅ Fait (2026-08-27) | Annuaire des employés par département (nom, email), réservé à l'administrateur (page et lien de nav), même motif de navigation par département que `TemplatesDepartementPage.jsx`. Route `/employes` |
| Paramètres | ⬜ Pas commencé | Lien de nav déjà présent dans `navConfig.js`, pointe vers une route non câblée (redirection vers `/`) |

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
18. **Le modèle `Destinataire`** (jour 10) a été créé dans `apps.campagnes` (pas dans `apps.simulation`), car conceptuellement rattaché à `Campagne` — cohérent avec l'emplacement de `Departement`/`ScenarioPhishing`. `EnvoiTracking` (dans `apps.simulation`) continue de référencer un simple email, sans FK vers `Destinataire` — voir point de vigilance de l'écart n°13.
19. **`ScenarioPhishing.departements_cibles` utilise un `ArrayField` PostgreSQL** (`django.contrib.postgres.fields`) plutôt qu'un modèle de jointure séparé ou un champ texte — le plus direct pour stocker « un ou plusieurs départements » sur un seul scénario, et déjà utilisable avec `__contains` pour la sélection dans `EnvoiCampagneService`. Dépendance à PostgreSQL déjà assumée par le projet (postgres:16 en base).
20. **`EnvoiCampagneService.envoyer_campagne` reste rétrocompatible** : si la campagne n'a aucun `Destinataire` (jours 8-9, tests existants), le comportement précédent (liste d'emails explicite ou email de test par scénario) continue de fonctionner sans changement. Le nouveau chemin par département n'est utilisé que si des `Destinataire` existent.
21. **Petit ajout backend hors du périmètre « FRONTEND » demandé** : `GenerationAPIRequestSerializer` et `GenerationAPIView` acceptent désormais `departements_cibles`, pour que le sélecteur ajouté côté frontend fonctionne aussi en mode génération par IA (pas seulement en saisie manuelle, qui l'acceptait déjà via `ScenarioPhishingSerializer`). Plomberie minimale nécessaire pour que la fonctionnalité demandée soit réellement utilisable dans les deux modes.
22. **`ConsentementListView` autorise le rôle Responsable** (en plus de consultant/administrateur, seuls prévus par le plan), mais filtre le résultat aux demandes où `responsable_email` correspond à l'utilisateur connecté. Nécessaire pour que le responsable puisse voir, depuis l'application, la demande qu'il doit lui-même valider — sans quoi le flux d'authentification demandé par l'utilisateur (« le responsable doit valider depuis l'application ») serait impossible à réaliser en pratique.
23. **`Campagne.perimetre_valide` est désormais piloté automatiquement**, sur demande explicite de l'utilisateur, plutôt que saisi manuellement à la création : `false` à la création, `true` dès la validation du consentement (`ConsentementValiderView`), reste `true` au lancement. La modale de création ne propose donc plus que le département ; les champs Statut initial et Périmètre validé ont été retirés de l'interface.
24. **`AuthContext` doit être explicitement rafraîchi après login/logout** — ce n'est pas automatique en SPA React Router (le `AuthProvider` ne se remonte pas au changement de route). Bug réel corrigé le 2026-08-21 : `LoginPage` et la déconnexion appellent désormais `refresh()`. Point de vigilance pour toute future page qui changerait l'utilisateur authentifié.
25. **Nouvel endpoint `GET /api/campagnes/{id}/scenarios/`** (non prévu par le plan) créé pour permettre au frontend de préremplir la modale de lancement à partir du dernier scénario généré — décision utilisateur du 2026-08-21 pour éviter de ressaisir deux fois les mêmes informations d'expéditeur (une fois pour l'aperçu du scénario, jour 7 ; une fois pour l'envoi réel, jour 8). Le préremplissage ne s'applique que si `ConfigurationEnvoi` n'a pas déjà de valeur — la configuration d'envoi explicitement enregistrée reste toujours prioritaire.
26. **Retour en arrière partiel sur la segmentation multi-département de l'interface** (jour 10), décision utilisateur du 2026-08-21 : le sélecteur « Départements ciblés » et la gestion de destinataires par département ont été retirés de l'interface — une campagne cible déjà un seul département, et l'envoi à tout un groupe se fait via une adresse de diffusion (liste de distribution) existante côté client, pas via une liste de destinataires individuels gérée dans l'application.
27. **Le backend n'a volontairement pas été modifié en profondeur** pour ce retrait : `Destinataire`, ses endpoints, et `ScenarioPhishing.departements_cibles` restent en base et fonctionnels via l'API — seule l'interface ne les expose plus. Choix assumé pour limiter le risque (pas de migration de suppression, pas de perte de données) et parce que rien n'empêche une réactivation future de ces UI si le besoin réapparaît.
28. **`GenerationAPIRequestSerializer` remplace `departements_cibles` (écart n°21) par `expediteur_nom`/`expediteur_email`/`destinataire_email`**, désormais éditables en mode génération par IA comme en mode manuel (auparavant réservés au mode manuel). Champs optionnels, validation de format identique dans les deux modes.
29. **L'agrégation globale du tableau de bord/résultats est pondérée par le nombre réel d'emails envoyés**, pas une simple moyenne des pourcentages par département (`frontend/src/utils/score.js`, `computeGlobalStats`). Une moyenne arithmétique simple aurait surreprésenté un département peu testé (ex. 1 seul email envoyé) par rapport à un département massivement testé — le calcul pondéré donne un taux global fidèle au volume réel d'interactions.
30. **Les pages Tableau de bord et Résultats (jour 12) ont été délibérément réécrites pour ne comparer que des départements entre eux**, jamais des entreprises ou des secteurs, alors que les maquettes `app.html`/`resultats.html` d'origine comparaient plusieurs entreprises clientes par secteur — cohérent avec la suppression du modèle `Entreprise` au jour 6 (écart n°1). Consigne explicite de l'utilisateur pour ce jour précis. Aucune donnée fictive n'a été introduite pour compenser l'absence de graphiques d'évolution temporelle ou de détail par employé (ces vues du plan initial n'ont pas d'équivalent réel dans les endpoints du jour 12 et ont donc été omises plutôt que fabriquées).
31. **`build-essential` retiré du `Dockerfile` backend** (jour 13, décision utilisateur explicite après diagnostic) : aucune dépendance du projet n'a besoin de compiler quoi que ce soit sur Linux/amd64 (`psycopg[binary]` utilise des wheels précompilées, comme le reste des dépendances). Ce paquet tirait ~40 Mo de chaîne de compilation C/C++ qui échouait systématiquement à télécharger pendant la session du 2026-08-23. **Non encore vérifié que le build réussit sans lui** — première chose à confirmer à la reprise ; si `pip install` échoue avec une erreur de compilation, le réintroduire.
32. **`weasyprint>=61` remplacé par `weasyprint==62.3`** (épinglage exact) dans `requirements.txt`, suite au diagnostic du 2026-08-24 : une plage de version ouverte forçait `pip` à retélécharger et comparer 18 versions différentes, ce qui multipliait les occasions pour la corruption réseau active ce jour-là de produire des messages de conflit incohérents (`asgiref` puis `Pillow` selon l'essai). L'épinglage exact reste une bonne pratique au-delà du contexte réseau (résolution plus rapide et reproductible).
33. **Sigle officiel corrigé, décision utilisateur du 2026-08-25** : le sigle à utiliser partout dans le
    projet est **« Cybersecurity Research Laboratory (CRL) »** — et non « CyberSecurity Research
    Laboratory (CSRL) », qui apparaissait par erreur dans le pied de page du rapport PDF (jour 13) et
    dans les maquettes d'origine (`docs/maquettes/`, non modifiées — fichiers de référence historiques,
    hors périmètre de cette correction) et le document de planification (`docs/rapport_planification.md`,
    idem). La phrase de crédit « , IUSJC Eyang · CyberSecurity Research Laboratory (CSRL) » a par
    ailleurs été **entièrement retirée** du pied de page du rapport PDF (`apps/rapports/templates/rapports/rapport.html`)
    sur demande explicite — le pied de page ne mentionne désormais plus que H-SHIELD237 et la mention
    « document de simulation éducative, à usage interne ». **Point de vigilance pour toute future
    mention du laboratoire dans du contenu généré ou affiché à l'utilisateur** (nouvelles pages,
    nouveaux documents) : toujours écrire « Cybersecurity Research Laboratory (CRL) ».
34. **Retrait des boutons Topbar sans comportement réel** (`Sidebar`/`Topbar`, décision utilisateur du
    2026-08-25, en comparant la page Rapports PDF à sa maquette) : les boutons Rechercher, Notifications
    et Exporter du `Topbar` n'avaient **jamais** eu de gestionnaire de clic depuis leur création au jour 4
    — ils s'affichaient à l'identique sur **toutes** les pages sans rien faire. Retirés entièrement.
    Le bouton « + Nouvelle campagne » ne s'affiche désormais **que** sur la page Campagnes (seule page
    qui le câble réellement via `onNewCampaign`) au lieu d'apparaître partout ailleurs en rouge tout en
    étant silencieusement désactivé (`disabled={!onNewCampaign}` ne change pas l'apparence du bouton,
    ce qui créait un piège visuel). **Point de vigilance pour toute nouvelle page** : ne pas s'attendre
    à retrouver ces boutons génériques dans `Topbar` — chaque page doit désormais câbler explicitement
    ses propres actions via la prop `actions`.
35. **Page Rapports PDF affinée pour se rapprocher de `docs/maquettes/rapports.html`** (2026-08-25) :
    boutons de filtrage par statut avec compteurs (Tous / En attente / Active / Terminé, sur le modèle
    de `filter-btn` déjà utilisé par `CampagnesPage`) ; badge de statut coloré par gravité (rouge pour
    en attente, orange actif, vert terminé, gris brouillon — décision utilisateur explicite, contrairement
    au badge neutre `status-pill` gris utilisé sur `CampagnesPage`, volontairement laissé inchangé pour
    ne pas affecter cette autre page) ; bouton de suppression par ligne, réutilisant exactement le service
    `deleteCampagne` et le flux de confirmation déjà en place sur `CampagnesPage` (aucun modèle `Rapport`
    séparé n'existe côté backend — un rapport n'étant qu'une vue PDF à la demande d'une campagne,
    « supprimer le rapport » supprime la campagne elle-même).
36. **Le mode sombre est implémenté par redéfinition de variables CSS sous `[data-theme="dark"]`,
    plutôt que par une feuille de style sombre séparée ou des classes dupliquées par composant**
    (2026-08-27, `frontend/src/context/ThemeContext.jsx` + `index.css`). Rendu possible sans toucher un
    seul composant existant, car chaque page utilisait déjà `var(--bg)`/`var(--surface)`/`var(--text)`/etc.
    plutôt que des couleurs figées — décision de conception du jour 4 (layout de référence unique) qui
    paie ici. La sidebar (`var(--navy)`) reste volontairement identique dans les deux modes : déjà sombre
    par construction, conforme à la maquette. Quelques couleurs d'état ponctuelles restent codées en dur
    (ex. `.sector-btn.selected`, `#ebf0f9`) — lisibles mais pas parfaitement alignées sur la palette
    sombre ; non bloquant, à revoir au Jour 15 (QA visuelle) si jugé nécessaire.
37. **Choix du thème persisté côté client uniquement** (`localStorage`, clé `hshield-theme`), pas en base
    de données ni sur le profil utilisateur — cohérent avec la nature de préférence d'affichage locale,
    pas une donnée métier ; repris automatiquement à la reconnexion sur le même navigateur, mais pas
    partagé entre appareils. Non demandé explicitement, choix par défaut raisonnable pour ce type de
    réglage.
38. **`ScenarioPhishing` n'avait aucun champ de date jusqu'au 2026-08-27** — un oubli du modèle initial
    (jour 6), jamais remarqué faute de besoin d'affichage chronologique jusqu'à l'ajout de la modale
    « Voir l'email » (même journée). Ajouté avec `auto_now_add=True` et `Meta.ordering = ["-date_creation"]`,
    exactement le motif déjà en place sur `Campagne` — cohérence délibérée plutôt qu'un nouveau choix de
    conception. Migration écrite à la main (`0005_scenariophishing_date_creation`, voir écart n°3) avec un
    backfill `default=timezone.now` pour les scénarios déjà existants, qui héritent donc tous de la même
    date d'application de la migration plutôt que de leur véritable date de création — sans conséquence
    pratique, ces scénarios de test n'ont pas besoin d'être distingués entre eux par date exacte.
39. **Départements rendus dynamiques sans convertir les champs existants en `ForeignKey`** (2026-08-27,
    demande de l'encadreur) : `Campagne.departement`, `Destinataire.departement`,
    `ResponsableDepartement.departement`, `TemplateDepartement.departement` restent des `CharField` —
    seule la contrainte `choices=` (liée à l'ancienne énumération figée `Departement`) est retirée. Un
    nouveau modèle `DepartementConfigure` sert de registre autoritaire (code stable auto-généré + nom
    éditable), interrogé en live pour valider un code et résoudre son libellé
    (`services.departement_label()`) plutôt qu'une conversion FK jugée trop risquée pour les données de
    test déjà en place ce sprint (`ScenarioPhishing.departements_cibles`, en particulier, est un
    `ArrayField` qui n'admet pas nativement un tableau de FK). La classe `Departement(TextChoices)`
    d'origine est conservée comme constantes de commodité (tests, lisibilité), simplement débranchée de
    tout champ. Voir « Journal du 2026-08-27 (suite 4) » pour le détail complet de la décision.
40. **L'annuaire des employés (`apps.employes`) ne modifie ni ne remplace `Destinataire`** (jour 10,
    `apps.campagnes`) : les deux modèles coexistent, avec des rôles différents. `Destinataire` reste un
    modèle par-campagne (jamais atteignable depuis l'UI depuis le 2026-08-21, voir écart n°26/27) ;
    `Employe` est un annuaire persistant, indépendant de toute campagne particulière, géré une fois par
    l'administrateur et réutilisé à chaque lancement. `EnvoiCampagneService.envoyer_aux_employes()` ne
    passe jamais par `Destinataire` — il itère directement sur `Employe` et réutilise
    `_scenario_pour_departement()` + `envoyer_scenario()` (déjà écrits pour le chemin `Destinataire` du
    jour 10), sans créer de lignes `Destinataire` en coulisses. Choix délibéré : éviter toute ambiguïté
    entre « qui a été explicitement ciblé pour cette campagne » (`Destinataire`, resté inutilisé) et
    « qui existe dans l'entreprise » (`Employe`, la source de vérité pour l'envoi réel).

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

- **Aucun bug actif** au niveau applicatif. Le code des Jours 11 et 12 est
  vérifié et fonctionnel de bout en bout (voir journaux ci-dessus), y
  compris via 21 tests automatisés.
- **Bug corrigé le 2026-08-21** (pour référence) : l'affichage de
  l'utilisateur connecté restait figé sur l'ancien compte après une
  reconnexion, faute d'appel à `AuthContext.refresh()` — voir écart n°24.
- **Contrainte externe à garder en tête** : le plan gratuit Mailtrap limite
  le débit d'envoi plus strictement que le débit configuré côté
  application — espacer les tentatives d'envoi de campagne pendant les
  tests manuels (voir écart n°12). N'affecte pas la correction du code.
- **Point de vigilance permanent** : ne plus compter sur un bind mount pour le code backend (voir écart n°3) — toujours rebuild l'image après modification de code Python (**y compris nginx** si `nginx/conf.d/` change), et écrire les migrations à la main si `docker compose run --rm` est utilisé pour les générer.
- **Docker Desktop / Docker Hub restent occasionnellement instables** : après un restart de Docker Desktop, vérifier que l'image utilisée par un conteneur recréé est bien la plus récente (`docker images <nom> --format "{{.ID}} {{.CreatedAt}}"`) — un rebuild peut se perdre si le moteur redémarre pendant ou juste après. Un rebuild peut aussi échouer avec une erreur réseau (`401 Unauthorized`, `unexpected EOF`) ou une erreur interne buildx (`NotFound: forwarding Ping: no such job`) — relancer simplement `docker compose build` suffit en général.
- **Ralentissement Docker Desktop marqué le 2026-08-22** (voir « Journal du
  2026-08-22 », point 12) : `docker compose build`/`up -d`/`docker ps` ont
  pris plusieurs minutes sans sortie, et le conteneur `db` a dû effectuer
  une récupération WAL après arrêt non propre — résolu automatiquement,
  sans perte de données, mais nettement plus lent que d'habitude.
- **Panne réseau du 2026-08-24 (corruption de données en transit,
  diagnostic précis établi ce jour-là) : résolue d'elle-même** à la reprise
  de session du 2026-08-25 — `pip install` complet sans aucune erreur de
  hash, `apt-get` rapide (700-1000+ kB/s). L'hypothèse d'un défaut de
  déchargement de somme de contrôle réseau (TCP Checksum/Large Send
  Offload) reste plausible mais n'a pas eu besoin d'être contournée
  activement ; à surveiller si le symptôme (hash mismatch pip/apt) revient.
  Un `git push` isolé a de nouveau timeout le 2026-08-25 mais a réussi en
  relançant simplement la commande — réseau globalement fiable mais pas
  parfaitement stable.
- **Anomalie observée, cause non confirmée** : plusieurs campagnes de test créées en cours de session (ids 17, 20) ont disparu de la base entre deux vérifications, alors que `db_data` est un volume Docker nommé censé persister. Sans certitude sur la cause exacte (possiblement lié aux redémarrages Docker Desktop de la session) — à surveiller ; aucune perte de données de production n'est en jeu (uniquement des campagnes de test).
- Comptes de test disponibles : `admin@hshield237.local` / `AdminTest1234!` (rôle employe — nom trompeur, historique, non corrigé pour ne rien casser), `consultant@hshield237.local` / `Consultant1234!` (rôle consultant), `responsable@hshield237.local` / `Responsable1234!` (rôle responsable, désigné pour Informatique, créé le 2026-08-21 pour tester la validation de consentement), `administrateur@hshield237.local` / `Administrateur1234!` (rôle administrateur, créé le 2026-08-25 pour tester le registre des responsables), `arthur@hshield237.local` / `Responsable1234!` (rôle responsable, désigné pour Direction générale, créé le 2026-08-27 pour tester le refus de campagne et la visualisation d'email).

## Journal du 2026-08-27 — notification de refus, email visible par le responsable, déconnexion globale

Reprise de session après une pause (Docker Desktop à relancer manuellement
— voir « Bugs connus »). Trois demandes directes de l'utilisateur, toutes
liées à l'expérience du responsable et à la visibilité du refus.

1. **Le refus d'une campagne est désormais visible depuis l'onglet
   Campagnes**, pas seulement depuis Consentements. `CampagneSerializer`
   expose 4 nouveaux champs en lecture seule
   (`consentement_statut`, `consentement_statut_display`,
   `consentement_motifs_refus_display`, `consentement_motif_refus_details`),
   dérivés de `campagne.consentement` (`getattr` défensif, une campagne
   peut ne pas encore en avoir). `CampagneViewSet.queryset` utilise
   `select_related("consentement")` pour éviter une requête par campagne.
   Frontend (`CampagnesPage.jsx`) : bandeau d'alerte en haut de page si au
   moins une campagne affichée est refusée, et la colonne « Périmètre
   validé » affiche un badge rouge « Refusée » + la liste des motifs +
   le texte libre éventuel, à la place du badge neutre habituel.
2. **Le responsable peut désormais visualiser l'email de phishing avant
   de décider.** `ScenarioListView` (`GET
   /api/campagnes/<id>/scenarios/`) acceptait auparavant uniquement
   `IsConsultant | IsAdministrateur` — un responsable recevait un `403`.
   Élargi à `IsResponsable`, avec une vérification d'objet manuelle (même
   principe que `ConsentementValiderView`/`ConsentementRefuserView`) :
   un responsable ne peut voir que les scénarios d'une campagne dont il
   est effectivement le responsable désigné (`consentement.responsable_email`),
   `403` sinon — testé explicitement (bon responsable ✓, mauvais
   responsable ✗, campagne sans consentement assigné ✗). Frontend
   (`ConsentementsPage.jsx`) : nouveau bouton « Voir l'email » par ligne,
   visible dès que `isMyResponsability(c)`, ouvrant une modale qui
   réutilise le rendu d'aperçu déjà existant (`GenererScenarioPage.jsx`)
   — mêmes classes CSS (`email-meta`, `email-content`, `email-cta`,
   `sim-warning`).
3. **Le bouton « Se déconnecter » est déplacé dans le pied de la barre
   latérale**, en bas à gauche, à côté de l'email du compte connecté —
   auparavant, c'était un bouton `actions` du `Topbar`, câblé sur la
   seule page `DashboardPage.jsx` : **aucune autre page ne permettait de
   se déconnecter**, un vrai manque d'ergonomie corrigé au passage.
   `Sidebar.jsx` affiche maintenant l'email complet (plus le nom
   d'affichage, réservé au `title` du survol) + le rôle + un bouton icône
   dédié (`sidebar-logout-btn`), sur toutes les pages. `DashboardPage.jsx`
   nettoyé de son ancienne logique de déconnexion, désormais redondante.
4. **Vérification réelle complète** : 56/56 tests backend passent (5
   nouveaux : 2 pour l'exposition du consentement sur `CampagneSerializer`,
   3 pour la restriction d'accès aux scénarios par responsable). En
   navigateur réel (Puppeteer/Chrome) : compte responsable de test créé
   (`arthur@hshield237.local`), scénario de test généré, refus effectué
   avec motif → bandeau + badge rouge confirmés sur Campagnes, modale
   « Voir l'email » confirmée avec le bon contenu, pied de sidebar
   confirmé sur plusieurs pages (email tronqué proprement en CSS,
   bouton de déconnexion visible). Aucune erreur console.
5. **Aléa de reprise de session** : Docker Desktop s'était arrêté pendant
   la pause — redémarré manuellement par l'utilisateur puis par
   l'environnement, avec le ralentissement au premier démarrage déjà
   documenté (`WORKER TIMEOUT`/`SIGKILL` sur le backend) résolu par un
   `docker compose restart backend` ciblé, cohérent avec le pattern déjà
   observé plusieurs fois dans ce projet.

## Journal du 2026-08-27 (suite 2) — correctif objet dupliqué, mode sombre / mode clair

Reprise directe dans la même session que le « Journal du 2026-08-27 »
ci-dessus (Docker Desktop déjà relancé, services `healthy`). Deux demandes
directes de l'utilisateur, toutes deux hors plan des 20 jours.

### 1. Doublon de l'objet dans l'aperçu de l'email simulé

1. **Bug trouvé** : l'objet de l'email s'affichait deux fois dans
   l'aperçu — une fois dans la ligne d'en-tête (`De` / `À` / `Objet`), une
   seconde fois juste en dessous comme titre du corps du message
   (`<div className="email-subject-line">`, un reliquat visiblement inutile
   une fois l'en-tête déjà en place).
2. **Corrigé dans les deux endroits qui partagent ce motif d'aperçu** :
   `GenererScenarioPage.jsx` (aperçu du scénario généré) et
   `ConsentementsPage.jsx` (modale « Voir l'email » ajoutée le
   2026-08-27, qui avait copié le même motif). La ligne
   `email-subject-line` est supprimée dans les deux fichiers ; l'objet ne
   s'affiche plus que dans l'en-tête.
3. **Vérifié via Puppeteer** : soumission d'un scénario de test avec un
   objet unique (« TEST OBJET UNIQUE 12345 ») — une seule occurrence
   trouvée dans l'aperçu après correctif (contre deux avant), confirmé à
   la fois par comptage textuel du DOM et par capture d'écran.
4. **Committé et poussé** (commit `6392f7b`).

### 2. Bouton de bascule mode sombre / mode clair

5. **Nouveau `ThemeContext`** (`frontend/src/context/ThemeContext.jsx`) :
   gère le thème actif (`light`/`dark`), le persiste dans `localStorage`
   (clé `hshield-theme`, repris à la reconnexion) et l'initialise sinon
   sur la préférence système (`prefers-color-scheme`). Le thème est posé
   en attribut `data-theme` sur `<html>`.
6. **Aucun composant existant n'a eu besoin d'être modifié pour supporter
   le mode sombre** : un jeu de variables CSS sombres est redéfini sous
   `[data-theme="dark"]` dans `index.css` (`--bg`, `--surface`,
   `--surface2`, `--border`, `--text`, `--text2`, `--text3`, les fonds
   `*-light` des badges, les ombres) — chaque page utilisait déjà ces
   variables plutôt que des couleurs figées, décision de conception
   antérieure (jour 4) qui a rendu ce chantier presque gratuit. La
   sidebar (`var(--navy)`) reste inchangée dans les deux modes : elle est
   déjà sombre par construction, conforme à la maquette.
7. **Bouton ajouté dans `Topbar.jsx`** (icône soleil/lune + libellé),
   donc visible sur toutes les pages protégées plutôt que sur une seule.
   `App.jsx` enveloppé dans `<ThemeProvider>` (autour de `AuthProvider`).
8. **Écart mineur assumé, non traité** : quelques couleurs d'état
   « sélectionné » ponctuelles (ex. `.sector-btn.selected`, `#ebf0f9`) sont
   encore codées en dur plutôt que dérivées d'une variable — elles restent
   lisibles en mode sombre (texte navy sur pastille claire) mais ne
   suivent pas parfaitement la palette sombre. Non bloquant, à corriger
   si un futur passage de QA visuelle (Jour 15) le juge nécessaire.
9. **Vérifié via Puppeteer** : clic sur le bouton → `data-theme` passe de
   `light` à `dark`, couleur de fond du `body` changée, thème conservé
   après navigation vers une autre page et après rechargement complet
   (`localStorage.getItem("hshield-theme")` confirmé), aucune erreur
   console. Captures d'écran des deux états comparées visuellement
   (Tableau de bord) — rendu propre dans les deux modes.
10. **Committé et poussé** (commit `37aa153`).

## Journal du 2026-08-27 (suite 3) — versions d'email classées par date

Retour utilisateur direct sur la modale « Voir l'email » ajoutée plus tôt
dans la journée (« Journal du 2026-08-27 ») : quand une campagne compte
plusieurs scénarios (plusieurs versions successives d'un même email), ils
s'affichaient tous à la suite dans la même boîte de dialogue, sans ordre
ni repère — le responsable ne pouvait pas savoir laquelle consulter avant
de décider.

1. **Nouveau champ `ScenarioPhishing.date_creation`** (`DateTimeField`,
   `auto_now_add=True`), absent jusqu'ici — aucune date n'existait sur ce
   modèle. Migration `0005_scenariophishing_date_creation` écrite à la
   main (convention du projet, pas de bind mount backend — voir écart
   n°3), avec un `default=timezone.now` en `preserve_default=False` pour
   les lignes déjà existantes. `Meta.ordering = ["-date_creation"]` ajouté
   au modèle, identique au motif déjà utilisé sur `Campagne`.
2. **`ScenarioPhishingSerializer`** expose désormais `date_creation`
   (lecture seule). `ScenarioListView` trie explicitement
   `.order_by("-date_creation")` (remplace l'ancien `-id`, resté correct
   mais moins explicite).
3. **Frontend (`ConsentementsPage.jsx`)** : la modale affiche maintenant,
   quand une campagne a plus d'un scénario, un **sélecteur de versions**
   — liste classée de la plus récente à la plus ancienne, chaque entrée
   affichant sa date/heure et son objet, avec un badge « Plus récente »
   sur la première et un fond bleu clair sur la version actuellement
   affichée. Cliquer une entrée change l'aperçu affiché en dessous, sans
   recharger la page. Avec un seul scénario, le sélecteur est masqué et
   seule sa date de génération est rappelée en petit, pour ne pas
   surcharger le cas simple.
4. **Vérification réelle complète** : 57/57 tests backend (1 nouveau —
   tri du plus récent au plus ancien + présence de `date_creation` dans
   la réponse). En navigateur réel (Puppeteer) : 2 scénarios créés via le
   compte consultant sur la campagne Direction générale (déjà 5 scénarios
   de test des sessions précédentes, total 7 versions), connexion avec
   `arthur@hshield237.local` → modale « Voir l'email » → 7 entrées
   affichées classées par date, la plus récente pré-sélectionnée et son
   contenu affiché ; clic sur une entrée plus ancienne → contenu affiché
   mis à jour correctement (objet et corps de la bonne version).
5. **Aléa Docker Desktop rencontré et résolu** : après `docker compose up
   -d`, le backend est resté en boucle `WORKER TIMEOUT`/`SIGKILL` (pattern
   déjà documenté à plusieurs reprises), et le conteneur `frontend` est
   resté bloqué à l'état `Created` sans jamais démarrer alors que `nginx`
   dépendait de lui — résolu par `docker compose restart backend` puis
   `docker compose up -d frontend nginx` explicite. Pas un problème de
   code.
6. **Committé et poussé** (commit `805033f`).

## Journal du 2026-08-27 (suite 4) — registre dynamique des départements (étape 1/2)

Demande directe de l'encadreur, hors plan des 20 jours, en deux volets :
(1) rendre les départements configurables par l'administrateur plutôt que
figés en dur, (2) un annuaire d'employés + envoi individuel ciblé (voir
plan approuvé en mode plan, écrit dans
`C:\Users\Mr NDJOCK LEVY\.claude\plans\binary-imagining-kernighan.md`).
Livré en deux étapes indépendantes, vérifiées et committées séparément —
**cette entrée couvre l'étape 1**.

1. **Décision d'architecture retenue** (voir le plan pour la comparaison
   complète des deux options envisagées) : les champs qui stockaient déjà
   un code de département (`Campagne.departement`, `Destinataire.departement`,
   `ResponsableDepartement.departement`, `TemplateDepartement.departement`)
   **restent des `CharField` classiques** — pas de conversion en
   `ForeignKey`, jugée trop risquée pour un gain surtout esthétique
   (`ScenarioPhishing.departements_cibles` est un `ArrayField`, qui
   n'admet pas nativement un tableau de FK sans modèle intermédiaire, et
   les 4 autres conversions auraient exigé des migrations de données en
   plusieurs étapes sur des tables contenant déjà les données de test de
   cette session). Seule la contrainte `choices=` (liée à l'ancienne
   énumération figée) est retirée.
2. **Nouveau modèle `DepartementConfigure`** (`apps.campagnes.models`) :
   `code` (slug généré automatiquement depuis `nom` à la création,
   jamais modifiable ensuite — stabilité des références existantes),
   `nom` (éditable), `date_creation`. La classe `Departement(TextChoices)`
   d'origine est **conservée telle quelle** comme constantes de commodité
   (`Departement.IT == "it"`) pour ne pas casser la quasi-totalité des
   tests existants qui la référencent — elle n'est simplement plus
   branchée à `choices=` sur aucun champ.
3. **Libellé résolu en live plutôt que figé** : nouvelle fonction
   `apps.campagnes.services.departement_label(code)` (lecture de
   `DepartementConfigure`, repli sur le code brut si le département a été
   supprimé depuis). Remplace `get_departement_display()` (qui dépendait
   de `choices=`) dans 5 serializers (`CampagneSerializer`,
   `DestinataireSerializer`, `ResponsableDepartementSerializer`,
   `ConsentementSerializer.campagne_departement_display`,
   `TemplateDepartementSerializer`), dans les `__str__()` des modèles
   concernés, dans `score_par_departement()`/`historique_par_departement()`
   (itèrent maintenant sur `DepartementConfigure.objects.all()` au lieu de
   `Departement.choices` — ces endpoints ne renvoient donc plus
   systématiquement 10 entrées, mais autant que de départements réellement
   configurés), et dans le prompt de génération Claude
   (`apps.generation.services`).
4. **CRUD `/api/departements/`** (`DepartementViewSet`, `apps.campagnes`) :
   lecture ouverte à consultant/administrateur/responsable, écriture
   (créer/renommer/supprimer) réservée à l'administrateur.
   **Suppression bloquée** si le département est encore référencé par des
   campagnes, destinataires, responsables ou templates — `400` avec un
   message listant explicitement ce qui bloque, plutôt qu'une suppression
   silencieuse qui laisserait des données orphelines.
5. **Migrations écrites à la main** (pas de bind mount backend, voir
   écart n°3) : `campagnes/0006_departement_registry` (création du modèle
   + seed des 10 départements existants, mêmes codes qu'avant — aucune
   donnée existante à migrer), `campagnes/0007_departement_choices_dynamiques`
   + `gouvernance/0003_...` + `templates_departement/0002_...` (retrait de
   `choices=`, aucun changement de colonne).
6. **Frontend** : nouveau `DepartementsContext` (même motif que
   `AuthContext`/`ThemeContext`) chargeant la liste une fois et exposant
   `labelFor(code)` ; `utils/departements.js` ne garde que les icônes
   (statiques, décoratives) — la liste et les libellés viennent
   désormais de l'API. Nouvelle page `/departements` (admin uniquement,
   même motif modale/toast que `ResponsablesPage.jsx`).
   `CampagnesPage`, `GenererScenarioPage`, `RapportsPDFPage`,
   `ResponsablesPage`, `TemplatesDepartementPage` adaptées pour consommer
   la liste dynamique. Nav : entrée « Départements »
   (`roles: ["administrateur"]`).
7. **Bug trouvé et corrigé pendant la vérification** : `EnvoiCampagneService`
   (`apps.simulation.services`) appelait encore
   `destinataire.get_departement_display()` — raté lors de l'exploration
   initiale (hors des serializers, dans un message d'erreur). Corrigé en
   important `departement_label`.
8. **7 nouveaux tests** (`apps.campagnes.tests.DepartementRegistryTests`) :
   lecture consultant, création admin-only avec code auto-généré,
   renommage propagé, suppression bloquée si utilisé, suppression permise
   si inutilisé, campagne refusant un code de département inconnu.
   **64/64 tests backend passent.**
9. **Vérification réelle complète en navigateur** (Puppeteer, compte
   administrateur) : création d'un département « Support technique »
   (code auto-généré `support-technique`) ; renommage d'« Informatique »
   en « Technologies de l'information » confirmé propagé immédiatement au
   sélecteur de création de campagne (sans rechargement de page ni action
   supplémentaire) ; suppression bloquée sur « Direction générale »
   (utilisée par la campagne de test du responsable `arthur@hshield237.local`)
   avec le message d'erreur exact attendu ; suppression réussie sur les
   départements réellement inutilisés. Pages Templates et Responsables
   revérifiées fonctionnelles avec la nouvelle source dynamique, aucune
   erreur console. **Données de test restaurées après vérification**
   (« Informatique » et « Ressources humaines » recréés à l'identique
   pour ne pas fausser l'état du jeu de données de démonstration).
10. **Committé et poussé** (commit `86450c9`).

Prochaine étape : **annuaire des employés par département + sélecteur
d'envoi individuel ciblé** (étape 2/2 du même chantier) — voir « Journal
du 2026-08-27 (suite 5) » ci-dessous, désormais terminée elle aussi.

## Journal du 2026-08-27 (suite 5) — annuaire des employés, envoi individuel ciblé (étape 2/2)

Suite directe de l'étape 1 (registre des départements). Plan déjà
approuvé suivi tel quel (voir
`C:\Users\Mr NDJOCK LEVY\.claude\plans\binary-imagining-kernighan.md`).

1. **Découverte clé de l'exploration préalable** : le point NB de la
   demande de l'encadreur (« seul l'expéditeur et le récepteur visibles
   dans l'en-tête ») était **déjà satisfait** par le code existant —
   `EnvoiCampagneService.envoyer_scenario()` (jour 8) construit toujours
   `to=[un_seul_email]`, jamais plusieurs adresses dans un même message.
   Aucun changement nécessaire sur la construction des emails eux-mêmes —
   tout le travail a porté sur la source des destinataires et l'interface
   de sélection.
2. **Nouvelle app `apps.employes`** (même convention qu'une app par
   domaine métier) : modèle `Employe` (`nom`, `email` unique,
   `departement` — `CharField` validé en live contre
   `DepartementConfigure`, même décision que l'étape 1, pas de
   `ForeignKey`). CRUD `/api/employes/` (`ModelViewSet`, filtrable par
   `?departement=`), lecture ouverte à consultant/administrateur (le
   consultant en a besoin pour choisir un destinataire au lancement),
   écriture réservée à l'administrateur.
3. **`EnvoiCampagneService.envoyer_aux_employes(cible, employe_id=None)`** —
   nouvelle méthode qui **réutilise intégralement**
   `_scenario_pour_departement()` et `envoyer_scenario()` déjà en place
   (aucune modification de la logique d'envoi elle-même) : itère soit sur
   tous les `Employe` du département de la campagne (`cible="tous"`),
   soit sur un seul (`cible="un_employe"`, `employe_id`) — erreurs
   claires si l'annuaire est vide pour ce département ou si l'employé
   choisi appartient à un autre département que la campagne.
4. **`EnvoyerCampagneRequestSerializer` étendu** (`cible`, `employe_id`) ;
   `EnvoyerCampagneView` bascule vers `envoyer_aux_employes()` si `cible`
   est fournie, sinon conserve tel quel le comportement historique
   (destinataires explicites, ou email de test de chaque scénario à
   défaut) — rétrocompatible.
5. **`DepartementViewSet.destroy()`** (étape 1) vérifie désormais aussi
   les `Employe` avant d'autoriser la suppression d'un département.
6. **Frontend** : `api/employes.js` (mêmes conventions que les autres
   modules API) ; nouvelle page `/employes` (admin uniquement, même motif
   que `TemplatesDepartementPage.jsx` — navigation par département en
   colonne de gauche). Modale de lancement (`CampagnesPage.jsx`) :
   nouvelle section « Destinataires » — radio « Tous les employés du
   département (N) » / « Un employé en particulier » (liste déroulante
   nom + email) — chargée avec `listEmployes({ departement })` à
   l'ouverture de la modale ; `envoyerCampagne()` (`api/simulation.js`)
   étendu pour accepter `{ cible, employeId }`. Nav : entrée « Employés »
   (`roles: ["administrateur"]`).
7. **13 nouveaux tests** (`apps.employes.tests`, plus des ajouts dans
   `apps.simulation.tests` et `apps.campagnes.tests`) : CRUD et
   permissions de l'annuaire, filtre par département, email déjà utilisé
   refusé, département inconnu refusé, envoi à tous les employés d'un
   département, envoi à un seul, employé d'un autre département refusé,
   annuaire vide levant une erreur claire, endpoint `envoyer/` avec
   `cible=tous` et `cible=un_employe` sans `employe_id` (400).
   **78/78 tests backend passent.**
8. **Vérification réelle complète en navigateur** (Puppeteer, compte
   administrateur) : 2 employés ajoutés pour le département Informatique,
   lancement testé sur une campagne à consentement déjà validé (#31) —
   « Tous les employés du département (2) » a bien déclenché 2 emails
   individuels distincts (un par employé, confirmé par les
   `EnvoiTracking` créés en base, horodatés séparément selon le délai
   configuré) ; « Un employé en particulier » a bien déclenché exactement
   1 email, uniquement au destinataire sélectionné, testé à plusieurs
   reprises avec des employés différents à chaque fois. Aucune erreur
   console sur l'ensemble du parcours. Données de test (les 2 employés)
   supprimées après vérification.
9. **Aléa rencontré, non lié au code** : un essai de lancement a renvoyé
   un `400` isolé pendant les tests répétés en rafale — cohérent avec la
   limite de débit déjà documentée du plan gratuit Mailtrap (voir écart
   n°12, « Bugs connus »), confirmé en relançant immédiatement le même
   envoi avec succès via le service directement (`manage.py shell`) sans
   aucun changement de code entre les deux tentatives.
10. **Committé et poussé** (commit `951571e`).

**Les deux étapes de ce chantier sont maintenant terminées et vérifiées.**

## Prochaine action précise

**Toutes les demandes explicites sont à jour**, y compris le chantier
complet des départements dynamiques + annuaire des employés (étapes 1 et
2, voir « Journal du 2026-08-27 (suite 4) » et « (suite 5) »). Pistes pour
la suite, aucune n'a encore été redemandée explicitement :

1. **Jour 15 du plan** (vérification de fidélité visuelle) : comparer
   chaque page développée à sa maquette de référence — d'autant plus
   pertinent après le mode sombre, les départements dynamiques et les
   deux nouvelles pages (Départements, Employés) qui n'ont pas de
   maquette de référence d'origine et suivent donc uniquement les
   conventions déjà établies (cartes, modales, toasts).
2. **Jour 16** (page Paramètres) : reste le seul lien de nav encore non
   câblé.
3. Avant de reprendre, vérifier l'état de Docker Desktop
   (`docker compose ps`) — il s'est arrêté entre deux sessions à plusieurs
   reprises ce sprint (voir « Bugs connus ») ; relancer avec
   `docker compose up -d` et patienter le ralentissement au premier
   démarrage si les workers backend bouclent en `WORKER TIMEOUT`.
4. Comptes de test : `consultant@hshield237.local` / `Consultant1234!`,
   `administrateur@hshield237.local` / `Administrateur1234!` toujours
   valides ; `arthur@hshield237.local` / `Responsable1234!` (rôle
   responsable, désigné pour Direction générale) (voir « Bugs connus »).
   L'annuaire des employés (`/employes`) est vide en conditions réelles —
   à peupler avant toute démonstration de lancement de campagne (le
   lancement est bloqué avec un message explicite tant qu'aucun employé
   n'est configuré pour le département concerné).
