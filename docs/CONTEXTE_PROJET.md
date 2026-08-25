# Contexte du projet H-SHIELD237 — reprise de session

> Document de reprise rapide pour une nouvelle session Claude Code. Réfère-toi à
> `docs/rapport_planification.md` pour le détail de chaque jour du sprint (20 jours,
> 14 août → 2 septembre 2026).

## État d'avancement

- **Dernier travail entièrement terminé et vérifié en conditions réelles :
  refonte de la gouvernance du consentement** (2026-08-25, hors plan des 20
  jours, demande directe de l'utilisateur) — voir « Journal du 2026-08-25
  (suite) » ci-dessous. Registre des responsables par département géré par
  l'administrateur, génération automatique de la demande de consentement,
  refus justifié par motifs, bouton « Lancer » désactivé sans validation.
- **Dernier jour du plan entièrement terminé et vérifié en conditions réelles : Jour 12**
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

## Modules implémentés

### Backend (`backend/apps/`)

| App | État | Détail |
|---|---|---|
| `accounts` | ✅ Fait | Modèle `Utilisateur` (AbstractUser + `role`), JWT (login/refresh/me), permissions `IsConsultant`/`IsResponsable`/`IsAdministrateur` |
| `entreprises` | ❌ **Supprimée** | Retirée au jour 6 — voir « Décisions et écarts » |
| `campagnes` | ✅ Fait | Modèles `Campagne`, `ScenarioPhishing` (+ `piece_jointe`, `departements_cibles`) et `Destinataire` (email + département, jour 10), ViewSet CRUD, endpoints destinataires, filtres statut/departement, pagination, fixture de test. **`Destinataire` et `departements_cibles` ne sont plus utilisés par le frontend depuis le 2026-08-21** (voir écart n°28) mais restent fonctionnels côté API. **Jour 12** : `services.py` (calcul du score), endpoints `.../score/` et `.../departements/score/`, `tests.py` (5 tests). **Jour 14** : `services.historique_par_departement()`, endpoint `.../departements/historique/` (historique campagne par campagne, pas un seul chiffre agrégé — pour l'évolution du score dans le temps), 3 tests supplémentaires |
| `generation` | ✅ Fait | `ClaudeGenerationService`, endpoints `/api/generation/api/` (accepte désormais `expediteur_nom`/`expediteur_email`/`destinataire_email`, plus `departements_cibles`) et `/api/generation/manuel/` (multipart, pièce jointe) ; `ScenarioPhishing` étendu avec expediteur_nom/expediteur_email/destinataire_email/est_html |
| `simulation` | ✅ Fait (jours 8-11) | `EnvoiCampagneService` (sélection par département jour 10, **blocage sans consentement validé jour 11**), `ConfigurationEnvoi`, `EnvoiTracking`, vue publique de capture (jour 8) ; modèle `Interaction`, pixel de suivi, tracking clic/soumission (jour 9) ; `tests.py` (6 tests). **Manque encore** : déclencheur du type `signalement` (aucun mécanisme prévu) |
| `gouvernance` | ✅ Fait (jour 11, étendu le 2026-08-25) | Modèles `Consentement` (+ `motifs_refus`, `motif_refus_details`), `JournalAudit`, `ResponsableDepartement` (registre admin-only) ; endpoints demande (admin-only)/liste/valider/refuser (motifs obligatoires)/journal-audit/responsables (CRUD admin-only) ; `services.creer_consentement_auto` ; `tests.py` (23 tests) |
| `rapports` | ✅ Fait (jour 13 backend) | `GenerationRapportService` (WeasyPrint 69.0), endpoint `.../rapport/`, `tests.py` (4 tests). Vérifié en direct (PDF réel via curl) et committé — voir « Journal du 2026-08-25 » |
| `templates_departement` | 🟡 Backend fait (2026-08-25) | Renommé depuis `templates_sectoriels` du plan (voir écart n°38). Modèle `TemplateDepartement` (nom, departement, prompt_structure, nombre_utilisations), CRUD `IsConsultant\|IsAdministrateur` (`/api/templates-departement/`, filtrable par département). `ClaudeGenerationService` accepte un `template` optionnel, incrémente `nombre_utilisations` à l'usage. `tests.py` (5 tests) + `apps/generation/tests.py` (4 tests, nouveau fichier). **Frontend pas encore câblé.** |

### Frontend (`frontend/src/pages/`)

| Page | État | Détail |
|---|---|---|
| `Login/LoginPage.jsx` | ✅ Fait | Fidèle à `login.html`, connectée à l'API |
| `components/Layout/` | ✅ Fait | Sidebar/topbar de référence, importé par toutes les pages |
| `Dashboard/DashboardPage.jsx` | ✅ Fait (jour 12) | Métriques réelles (campagnes actives, emails envoyés, taux de clic moyen, score de vulnérabilité), comparatif par département, jauge de score (`ScoreRing`), campagnes récentes, alerte automatique si risque élevé |
| `Campagnes/CampagnesPage.jsx` | ✅ Fait | Tableau, recherche, filtres statut, pagination réelle, actions rapides, modale de création simplifiée (département uniquement, jour 11), modale de lancement (expéditeur/Reply-To/débit + avertissement DNS, jour 8 ; préremplissage expéditeur depuis le dernier scénario, jour 11). **Section « Destinataires par département » retirée le 2026-08-21** (voir journal) |
| `GenererScenario/GenererScenarioPage.jsx` | ✅ Fait | Sélecteur API/Manuel, formulaire adapté (département), aperçu enrichi (De/À, CTA, mode HTML), validation inline, scroll automatique (jour 7). Champs **Expéditeur/destinataire communs aux deux modes** depuis le 2026-08-21 (auparavant manuel uniquement) ; **sélecteur « Départements ciblés » retiré** le même jour |
| `Consentements/ConsentementsPage.jsx` | ✅ Fait (jour 11, refondu le 2026-08-25) | Métriques, recherche/filtres par statut, actions Valider/Refuser réservées au responsable désigné authentifié, modale de refus avec motifs à cocher + texte libre. Plus de saisie manuelle du responsable (retirée) ; section admin-only « Campagnes sans consentement » avec génération manuelle |
| `Responsables/ResponsablesPage.jsx` | ✅ Fait (2026-08-25) | Registre des responsables par département, réservé à l'administrateur (page et lien de nav). Route `/responsables` |
| `Resultats/ResultatsPage.jsx` | ✅ Fait (jour 12) | Vue globale (jauge, comportements observés, classement des départements) et vue « Par département » (tableau détaillé), filtre par campagne individuelle. Route `/resultats` câblée dans `App.jsx` |
| `RapportsPDF/RapportsPDFPage.jsx` | ✅ Fait (jour 13, affiné le 2026-08-25) | Liste des campagnes (une par département), filtres par statut avec compteurs, badge de statut coloré, suppression, aperçu du score au clic (jauge + barres), téléchargement du PDF à la demande via blob. Route `/rapports` câblée dans `App.jsx` |
| Historique, TemplatesSectoriels, Paramètres | ⬜ Pas commencé | Liens de nav déjà présents dans `navConfig.js`, pointent vers des routes non câblées (redirection vers `/`) |

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
- Comptes de test disponibles : `admin@hshield237.local` / `AdminTest1234!` (rôle employe — nom trompeur, historique, non corrigé pour ne rien casser), `consultant@hshield237.local` / `Consultant1234!` (rôle consultant), `responsable@hshield237.local` / `Responsable1234!` (rôle responsable, créé le 2026-08-21 pour tester la validation de consentement), `administrateur@hshield237.local` / `Administrateur1234!` (rôle administrateur, créé le 2026-08-25 pour tester le registre des responsables).

## Prochaine action précise

Le **Jour 13 est entièrement terminé** (backend commit `c88aa61`, frontend
commit `43ffcb4`), la **refonte de la gouvernance du consentement**
(registre des responsables, refus justifié, blocage du bouton Lancer) est
également terminée et vérifiée, et le **Jour 14 backend** (templates par
département, historique) est fait et vérifié — voir « Journal du
2026-08-25 (suite 2) ». **Reste le Jour 14 frontend :**

1. **FRONTEND** : connecter les pages Templates (renommer en
   `TemplatesDepartement` ou similaire — le lien de nav « Templates
   sectoriels » et sa route doivent aussi être renommés, cohérence avec
   l'écart n°38) et Historique (`docs/maquettes/templates.html`,
   `docs/maquettes/historique.html`) aux
   nouveaux endpoints — même adaptation multi-entreprise → département
   probablement nécessaire que pour les jours 12 et 13.
3. Comptes de test : `consultant@hshield237.local` / `Consultant1234!`
   toujours valide (voir « Bugs connus »).
