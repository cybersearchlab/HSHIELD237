# Rapport de planification — Sprint de finalisation 20 jours
## H-SHIELD237 — VS Code + Claude Code + Docker Desktop (Windows)

**Du 14 août au 2 septembre 2026**
Rédigé par : NDJOCK NJAP JEREMIE LEVY
IUSJC Eyang · CyberSecurity Research Laboratory (CSRL) · Août 2026

---

> **Note pour Claude Code** : ce document est la référence de planification du projet H-SHIELD237. Il peut être cité dans les prompts (ex. « suis la procédure du jour 7 décrite dans ce fichier ») pour retrouver le contexte d'une étape, l'objectif d'un module, ou vérifier qu'une implémentation respecte l'architecture prévue.

---

## Note de révision

Cette version reflète l'environnement de développement finalement retenu : Claude Code installé et utilisé en ligne de commande, depuis le terminal intégré de VS Code — et non Claude Code Desktop, dont l'installation CLI n'avait pas abouti sous Windows lors d'une version précédente du plan.

| Élément révisé | Version précédente | Version actuelle |
|---|---|---|
| Outil de développement | Claude Code Desktop (installation CLI non aboutie sous Windows) | Claude Code installé avec succès en ligne de commande, utilisé depuis le terminal intégré de VS Code |
| Prérequis machine | Non détaillés | Liste explicite des logiciels à installer avant le jour 1 (section 1) |
| Référencement des maquettes | Jointes manuellement à chaque prompt frontend | Placées dans `docs/maquettes/` au sein du dépôt et référencées par chemin de fichier — Claude Code les lit directement |

---

## Objectif principal du sprint

Ce rapport planifie la finalisation de H-SHIELD237 sur un délai resserré de 20 jours calendaires, du 14 août au 2 septembre 2026, développée exclusivement à l'aide de Claude Code depuis le terminal intégré de Visual Studio Code, et déployée via Docker Desktop sous Windows. Le frontend et le backend sont développés en parallèle, module par module : chaque jour de développement produit une fonctionnalité testable de bout en bout, de l'interface jusqu'à la base de données.

Trois besoins fonctionnels identifiés en cours de conception restent intégrés au périmètre du sprint : la possibilité de générer un scénario manuellement lorsque l'API Claude n'est pas disponible, la segmentation des campagnes par département, et un ensemble de mesures pour limiter le risque que les emails simulés soient classés comme spam. **La sécurité applicative approfondie (Top 10 OWASP) reste hors périmètre de ce sprint, par décision assumée** — voir le point d'attention en section 6.

---

## 1. Prérequis techniques — logiciels à installer

Cette liste concerne la machine de développement (Windows) — à distinguer de ce qui tourne à l'intérieur des conteneurs Docker en production. Installer PostgreSQL ou Node.js en local ne sert pas à faire tourner l'application elle-même (qui reste entièrement conteneurisée) mais à disposer d'un confort de développement réel : autocomplétion dans l'éditeur, inspection directe de la base de données, exécution de Claude Code.

| Logiciel | Usage dans le projet |
|---|---|
| Git for Windows | Gestion de version ; fournit également Git Bash, pratique comme terminal alternatif à PowerShell. |
| Visual Studio Code | Éditeur principal du projet et hôte du terminal intégré depuis lequel Claude Code est lancé. |
| Node.js LTS (version 20) | Requis pour installer Claude Code (`npm install -g @anthropic-ai/claude-code`) et pour le développement du frontend React/Vite. |
| Claude Code (CLI) | Outil de développement assisté par IA utilisé tout au long du sprint, authentifié via l'abonnement Claude Pro. |
| Python 3.12 | Exécution locale du backend Django hors conteneur — utile pour l'autocomplétion dans VS Code, la rédaction de migrations et des tests rapides sans reconstruire l'image Docker à chaque changement. |
| Docker Desktop (Windows) | Construit et orchestre les conteneurs du projet (backend, frontend, base de données, Nginx) définis dans `docker-compose.yml`. |
| WSL2 (Windows Subsystem for Linux) | Backend requis par Docker Desktop ; activation via la commande `wsl --install` si non déjà présent. |
| Outils client PostgreSQL (psql, ou une interface graphique type pgAdmin / DBeaver) | Permettent d'inspecter directement les tables de la base de données qui tourne dans le conteneur Docker, sans devoir tout vérifier depuis l'application. Le serveur PostgreSQL complet n'a pas besoin d'être installé en local, puisqu'il tourne déjà dans Docker. |
| Extensions VS Code recommandées : Python, ESLint, Prettier, Docker, GitLens, Thunder Client | Thunder Client permet de tester les endpoints DRF directement depuis VS Code, sans dépendre d'un outil externe comme Postman. |

> **Ordre d'installation conseillé** : Git → VS Code → Node.js → Claude Code (`npm install -g`) → Python → WSL2 → Docker Desktop (redémarrage requis après activation de WSL2) → outils client PostgreSQL. Vérifier que `claude` répond bien dans le terminal intégré de VS Code avant de démarrer le jour 1.

---

## 2. Structure générale du dossier du projet

Le projet est organisé en monorepo — un seul dépôt Git contenant le backend, le frontend et la configuration d'orchestration. Le dossier `docs/maquettes/` centralise les fichiers de maquette déjà validés, que Claude Code référence directement par leur chemin dans les prompts plutôt que de les recevoir en pièce jointe.

```
hshield237/
├── docker-compose.yml
├── .env.example
├── .env                        (jamais commité — voir .gitignore)
├── .gitignore
├── README.md
├── docs/
│   ├── cahier_des_charges_v2.docx
│   ├── rapport_planification.md  (ce document)
│   ├── charte_graphique.html     (référence pour la fidélité visuelle)
│   ├── DEPLOIEMENT.md            (créé au jour 19)
│   └── maquettes/                 (copiées au jour 1)
│       ├── login.html
│       ├── app.html
│       ├── campagnes.html
│       ├── resultats.html
│       ├── rapports.html
│       ├── historique.html
│       ├── templates.html
│       └── entreprises_consentements_parametres.html
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── manage.py
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── dev.py
│   │   │   └── prod.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── apps/
│   │   ├── accounts/            (authentification, rôles, permissions)
│   │   ├── entreprises/         (module Entreprise cliente)
│   │   ├── campagnes/           (Campagne, ScenarioPhishing, département)
│   │   ├── generation/          (API Claude + mode manuel)
│   │   ├── simulation/          (SMTP, tracking, fausse page, anti-spam)
│   │   ├── gouvernance/         (consentement, journal d'audit)
│   │   ├── rapports/            (génération PDF)
│   │   └── templates_sectoriels/
│   └── tests/
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── api/                 (client Axios, intercepteur JWT)
│   │   ├── components/
│   │   │   └── Layout/          (sidebar, topbar — référence visuelle unique)
│   │   ├── pages/
│   │   │   ├── Login/
│   │   │   ├── Dashboard/
│   │   │   ├── GenererScenario/ (mode API / mode manuel)
│   │   │   ├── Campagnes/       (segmentation par département)
│   │   │   ├── Resultats/
│   │   │   ├── RapportsPDF/
│   │   │   ├── Historique/
│   │   │   ├── TemplatesSectoriels/
│   │   │   ├── EntreprisesClientes/
│   │   │   ├── Consentements/
│   │   │   └── Parametres/
│   │   ├── routes/
│   │   └── App.jsx
│   └── public/
│
└── nginx/
    ├── Dockerfile
    └── default.conf
```

---

## 3. Méthode de travail

### 3.1 Environnement technique

Le sprint repose sur trois outils dont les rôles doivent être clairement distingués :

| Outil | Rôle |
|---|---|
| **Claude Code** (CLI, terminal VS Code) | Outil de développement, utilisé pour générer et faire évoluer le code du projet. Authentifié via l'abonnement Claude Pro — aucune clé API distincte n'est nécessaire pour l'utiliser. |
| **Docker Desktop** (Windows, WSL2) | Exécute et orchestre les conteneurs du projet (backend, frontend, base de données, Nginx) définis dans `docker-compose.yml`. |
| **API Claude** (console.anthropic.com) | Dépendance runtime de l'application elle-même : c'est elle que le backend appelle pour générer un scénario de phishing. Facturée séparément à l'usage, sans rapport avec l'abonnement Claude Pro. |

### 3.2 Principes appliqués tout au long du sprint

- Une session Claude Code par jour de développement, ouverte dans le terminal intégré de VS Code à la racine du monorepo.
- Chaque prompt précise explicitement le dossier concerné (`backend/apps/...` ou `frontend/src/...`) pour éviter toute ambiguïté de contexte.
- Le backend est toujours généré avant le frontend correspondant, jamais l'inverse, pour que le frontend puisse être connecté à une API déjà fonctionnelle.
- Chaque étape se termine par une vérification manuelle explicite dans le navigateur, via la browsable API DRF, ou via l'extension Thunder Client de VS Code.

### 3.3 Garantir la fidélité visuelle à la maquette

Claude Code, utilisé en ligne de commande, a accès au système de fichiers du projet : il peut lire directement un fichier de maquette placé dans le dépôt, sans qu'il soit nécessaire de le joindre manuellement à chaque message.

- Les 8 fichiers de maquette déjà validés sont copiés dans `docs/maquettes/` dès le jour 1, avec des noms courts et stables.
- Chaque prompt qui génère ou modifie une page frontend référence explicitement le chemin du fichier concerné plutôt que de décrire le style de mémoire.
- Le layout applicatif (sidebar, topbar) est créé une seule fois, au jour 4, à partir de `docs/maquettes/app.html`, puis importé par toutes les pages suivantes plutôt que régénéré à chaque fois — cela élimine la plus grande source de dérive visuelle.
- Un jour dédié (jour 15) est réservé à mi-sprint pour comparer systématiquement chaque page déjà développée à sa maquette de référence et corriger les écarts accumulés.
- La charte graphique déjà produite (`docs/charte_graphique.html`) sert de référence en cas de désaccord entre deux pages sur un détail de style.

### 3.4 Convention de commit

```
feat(module): description courte     — nouvelle fonctionnalité
fix(module): description courte      — correction
docs(module): description courte     — documentation
test(module): description courte     — ajout de tests
```

---

## 4. Calendrier des 4 phases

| Phase | Jours | Contenu |
|---|---|---|
| Phase 1 — Fondations | 1 – 5 | Docker, Django, authentification JWT, layout frontend de référence |
| Phase 2 — Modules cœur | 6 – 10 | Campagnes, génération LLM + mode manuel, envoi SMTP anti-spam, tracking, segmentation par département |
| Phase 3 — Gouvernance & résultats | 11 – 15 | Consentement, audit, score de vulnérabilité, rapports PDF, templates, vérification de fidélité visuelle |
| Phase 4 — Finalisation & livraison | 16 – 20 | Paramètres, jour tampon, tests E2E, documentation, déploiement pilote |

### Jalons

| Jalon | Jour | Critère de validation |
|---|---|---|
| Jalon 1 | Jour 5 | Un utilisateur peut se connecter et voir le layout applicatif, en environnement Docker complet |
| Jalon 2 | Jour 10 | Un scénario peut être généré (API ou manuel), envoyé par département, et une interaction peut être trackée de bout en bout |
| Jalon 3 | Jour 15 | Une campagne complète respecte le cadre de gouvernance, produit un rapport PDF, et chaque page est visuellement fidèle à sa maquette |
| Jalon 4 | Jour 20 | La plateforme est déployée sur le VPS pilote et démontrable de bout en bout |

---

## 5. Détail des 20 étapes

Pour chaque jour du sprint : l'objectif poursuivi, le prompt à transmettre à Claude Code, et la procédure de vérification à suivre une fois le code généré.


### Phase 1 — Fondations

#### Jour 1 — Initialisation du monorepo et environnement Docker

*Poser la structure complète du projet (backend, frontend, nginx) et l'orchestration Docker, avant toute ligne de code métier.*

**Prompt Claude Code**

```
Initialise un monorepo pour le projet H-SHIELD237 avec la structure suivante :
backend/ (Django), frontend/ (React + Vite), nginx/, docker-compose.yml
à la racine.

Crée les Dockerfile pour chaque service :
- backend en Python 3.12
- frontend en Node 20, build multi-stage servi ensuite par nginx
- nginx en reverse proxy avec terminaison TLS

Ajoute un fichier .env.example listant toutes les variables nécessaires
(SECRET_KEY, DATABASE_URL, ANTHROPIC_API_KEY, EMAIL_HOST, EMAIL_PORT,
EMAIL_HOST_USER, EMAIL_HOST_PASSWORD, ALLOWED_HOSTS).

Ajoute un .gitignore adapté Python + Node + Docker.

Le docker-compose.yml doit définir 3 services : db (postgres:16),
backend, frontend, plus nginx comme reverse proxy.
```

**Procédure d'implémentation**

- mkdir hshield237 && cd hshield237 puis git init (terminal intégré de VS Code)
- code . — ouvrir le dossier dans VS Code s'il n'est pas déjà ouvert
- Dans le terminal intégré, lancer : claude
- Coller le prompt ci-dessus dans la session Claude Code
- Créer le dossier docs/maquettes/ et y copier les 8 fichiers HTML de maquette déjà validés, en les renommant simplement : login.html, app.html, campagnes.html, resultats.html, rapports.html, historique.html, templates.html, entreprises_consentements_parametres.html
- Copier .env.example vers .env puis renseigner les valeurs de développement
- Dans Docker Desktop, vérifier que le moteur WSL2 est actif (Settings > General > Use the WSL 2 based engine)

---

#### Jour 2 — Structure Django et connexion PostgreSQL

*Mettre en place un backend Django proprement structuré, avec les secrets exclusivement en variables d'environnement.*

**Prompt Claude Code**

```
Dans backend/, crée un projet Django avec Django REST Framework.

Structure les settings en trois fichiers :
- config/settings/base.py (commun)
- dev.py (DEBUG=True, CORS ouvert au frontend local)
- prod.py (DEBUG=False, ALLOWED_HOSTS depuis variable d'environnement)

Configure la connexion PostgreSQL exclusivement via variables
d'environnement (jamais en dur). Utilise django-environ pour la
gestion des secrets.

Crée l'app apps/accounts/ avec un modèle Utilisateur personnalisé
(AbstractUser) incluant un champ role
(consultant, responsable, employe, administrateur).
```

**Procédure d'implémentation**

- Lancer le prompt dans la session Claude Code déjà ouverte dans le terminal VS Code
- Ouvrir un second terminal intégré (icône + dans le panneau Terminal) : docker compose up db
- python manage.py makemigrations && python manage.py migrate
- Se connecter à la base avec psql -h localhost -U <user> -d <db> (ou pgAdmin/DBeaver) pour vérifier que les tables sont bien créées
- Vérifier /admin/ accessible et le modèle Utilisateur bien enregistré

---

#### Jour 3 — Authentification JWT + rôles (backend) et page de connexion (frontend)

*Livrer le premier parcours utilisateur complet de bout en bout : connexion réelle, pas simulée.*

**Prompt Claude Code**

```
BACKEND : ajoute djangorestframework-simplejwt à apps/accounts/.
Crée les endpoints /api/auth/login/, /api/auth/refresh/, /api/auth/me/.
Durée de vie courte pour l'access token (15 min), refresh token (7 jours).
Ajoute des permissions DRF personnalisées par rôle
(IsConsultant, IsResponsable, IsAdministrateur).

FRONTEND : initialise une app React avec Vite dans frontend/.
Configure React Router et un client Axios avec un intercepteur qui
joint le token JWT et gère le rafraîchissement automatique.
Crée la page de connexion (src/pages/Login) en reprenant fidèlement
le fichier docs/maquettes/login.html : fond navy à gauche, formulaire
à droite, champs email et mot de passe, bouton de connexion.
```

**Procédure d'implémentation**

- Exécuter d'abord la partie backend du prompt
- Tester /api/auth/login/ via la browsable API DRF, ou l'extension Thunder Client de VS Code
- Envoyer la partie frontend du prompt — Claude Code lit directement docs/maquettes/login.html depuis le dépôt
- npm run dev — valider visuellement la page de connexion contre la maquette
- Tester le flux complet : connexion → token stocké → requête authentifiée vers /api/auth/me/

---

#### Jour 4 — Modèle Entreprise (backend) et layout applicatif de référence (frontend)

*Premier module métier réel côté backend, et surtout : l'ossature visuelle (sidebar/topbar) que TOUTES les pages suivantes hériteront — la décision la plus importante pour la cohérence visuelle du reste du sprint.*

**Prompt Claude Code**

```
BACKEND : crée l'app apps/entreprises/ avec le modèle Entreprise
(nom, secteur, taille, contexte_additionnel, contact_nom,
contact_email, date_creation) et son CRUD via un ViewSet DRF,
permissions restreintes aux rôles consultant et administrateur.

FRONTEND : crée le layout principal (src/components/Layout) avec
la sidebar de navigation (logo H-SHIELD237, sections Principal /
Analyse / Configuration) et la topbar (titre de page, actions), en
reprenant fidèlement docs/maquettes/app.html. Ce composant Layout
doit devenir la référence visuelle unique importée par toutes les
pages développées dans la suite du sprint — n'improvise aucune
variation de couleur, d'espacement ou de rayon de bordure par
rapport à ce fichier.
```

**Procédure d'implémentation**

- Lancer le prompt backend, vérifier /api/entreprises/ via la browsable API
- Envoyer la partie frontend — Claude Code lit docs/maquettes/app.html pour la sidebar/topbar de référence
- Vérifier le rendu du layout avec des pages vides temporaires
- Commit git : feat(entreprises): modèle + layout applicatif de référence

---

#### Jour 5 — Intégration Docker complète et vérification de bout en bout

*Vérifier que l'environnement Docker Desktop fait tourner l'ensemble de la pile sans erreur avant d'attaquer les modules métier.*

**Prompt Claude Code**

```
Vérifie et complète le docker-compose.yml pour qu'il soit robuste
sous Docker Desktop (Windows, moteur WSL2) : health-checks sur
chaque service, dépendances explicites entre services
(depends_on avec condition service_healthy), politique de
redémarrage automatique, volume nommé pour la persistance
PostgreSQL. Ajoute un fichier .dockerignore pour backend/ et
frontend/ afin d'accélérer les reconstructions d'image.
```

**Procédure d'implémentation**

- Lancer le prompt dans la session Claude Code
- Dans le terminal : docker compose up --build
- Dans Docker Desktop, onglet Containers, vérifier que les 4 services affichent l'état Healthy
- Valider la connexion de bout en bout via le domaine de test local, à travers Nginx

---


### Phase 2 — Modules cœur

#### Jour 6 — Module Campagnes (backend) et page Campagnes (frontend)

*Introduire les entités centrales du système : Campagne et ScenarioPhishing.*

**Prompt Claude Code**

```
BACKEND : dans apps/campagnes/, crée les modèles Campagne
(entreprise FK, statut, date_creation, perimetre_valide) et
ScenarioPhishing (campagne FK, objet_email, corps_email,
url_fausse_page, secteur_cible). Expose un ViewSet DRF avec
pagination et filtres par statut et par entreprise.

FRONTEND : crée la page Campagnes (src/pages/Campagnes) en reprenant
fidèlement docs/maquettes/campagnes.html — tableau avec recherche,
filtres par statut, actions rapides — connectée à l'API réelle
plutôt qu'à des données simulées.
```

**Procédure d'implémentation**

- Lancer le prompt backend, vérifier les migrations
- Peupler quelques données de test via python manage.py shell ou une fixture JSON
- Envoyer la partie frontend — Claude Code lit docs/maquettes/campagnes.html
- Vérifier que le tableau consomme bien /api/campagnes/, tester les filtres et la pagination

---

#### Jour 7 — Génération LLM Claude et mode manuel de secours (backend + frontend)

*Garantir qu'un consultant sans accès à l'API Claude (clé API non provisionnée, quota épuisé) puisse tout de même produire un scénario, en le rédigeant lui-même via l'interface claude.ai puis en le collant dans l'application.*

**Prompt Claude Code**

```
BACKEND : crée apps/generation/ avec un service
ClaudeGenerationService qui appelle l'API Claude (clé lue depuis la
variable d'environnement ANTHROPIC_API_KEY — cette clé provient de
la console API Anthropic, indépendante de l'abonnement Claude Pro
utilisé par ailleurs pour Claude Code) pour générer un scénario à
partir du contexte entreprise. Ajoute également un endpoint
POST /api/generation/manuel/ qui accepte directement un objet
d'email, un corps de message et une URL de fausse page saisis à la
main, et crée un ScenarioPhishing strictement identique dans sa
structure à celui produit par l'API — les deux chemins doivent être
interchangeables pour le reste de l'application.

FRONTEND : sur la page Générer un scénario (déjà maquettée dans
docs/maquettes/app.html), ajoute un sélecteur « Génération par API /
Saisie manuelle » en haut du formulaire. En mode manuel, remplace le
formulaire secteur / entreprise / prétexte par trois champs de texte
libres (objet, corps, URL de fausse page) que le consultant remplit
après avoir rédigé le texte lui-même dans l'interface web claude.ai.
```

**Procédure d'implémentation**

- Configurer ANTHROPIC_API_KEY dans .env — la générer sur console.anthropic.com, pas sur claude.ai
- Lancer le prompt backend, tester les deux endpoints indépendamment
- Envoyer la partie frontend — Claude Code relit docs/maquettes/app.html pour la page Générer un scénario
- Tester le basculement Mode API / Mode manuel et vérifier que les deux chemins produisent un ScenarioPhishing exploitable par la suite du parcours

---

#### Jour 8 — Envoi SMTP, expéditeur configurable et limitation du débit (anti-spam)

*Envoyer les scénarios de façon réaliste (délivrabilité) et conforme à la logique de simulation (expéditeur affiché différent du compte technique), sans faire classer les campagnes en spam.*

**Prompt Claude Code**

```
BACKEND : dans apps/simulation/, crée un service
EnvoiCampagneService qui utilise le backend SMTP natif de Django
(EMAIL_HOST, EMAIL_PORT, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD
depuis les variables d'environnement — jamais un serveur SMTP
auto-hébergé). Permets de configurer, par campagne, un nom et une
adresse d'expéditeur affichés (en-tête From) distincts du compte
SMTP authentifié, avec un en-tête Reply-To neutre pointant vers une
adresse de test contrôlée, pour qu'aucune réponse d'un employé ne
parte vers une adresse non maîtrisée. Ajoute une limitation du
débit d'envoi configurable (ex. un email toutes les 2 secondes) pour
éviter d'être signalé comme trafic massif par le relais SMTP du
client.

Crée également une vue publique servant la fausse page de capture,
avec un identifiant de tracking unique par destinataire encodé dans
l'URL.

FRONTEND : ajoute à la modale de lancement de campagne (déjà
maquettée dans docs/maquettes/campagnes.html) les champs de
configuration de l'expéditeur affiché, et un texte d'avertissement
rappelant que la délivrabilité réelle dépend de la configuration DNS
du domaine utilisé par le client.
```

**Procédure d'implémentation**

- Configurer un compte SMTP de test (Mailtrap ou équivalent) pour ne jamais envoyer de vrais emails en développement
- Lancer le prompt, envoyer un email de test et vérifier l'en-tête From affiché dans le client de messagerie
- Observer les logs pour confirmer que le débit d'envoi est bien limité
- Cliquer le lien de la fausse page depuis l'email reçu et vérifier que la visite est enregistrée

---

#### Jour 9 — Tracking des interactions (pixel, clic, soumission, signalement)

*Capturer la donnée qui fait la valeur du produit : le comportement réel des employés testés.*

**Prompt Claude Code**

```
BACKEND : ajoute le modèle Interaction (destinataire FK,
type [ouverture / clic / soumission / signalement], horodatage,
adresse_ip) à apps/simulation/. Insère automatiquement un pixel de
suivi (image 1x1 servie par une vue dédiée) dans le corps de chaque
email envoyé, et enregistre l'ouverture correspondante. Enregistre
également l'événement de clic lors de l'accès à la fausse page, et
de soumission lors de l'envoi du formulaire de la fausse page.
```

**Procédure d'implémentation**

- Lancer le prompt
- Envoyer une campagne de test à une adresse contrôlée, ouvrir l'email, cliquer le lien, soumettre le formulaire
- Vérifier en base (psql ou pgAdmin/DBeaver) que les 3 types d'interaction sont enregistrés avec le bon horodatage
- Écrire un test automatisé simple qui simule ce parcours via le client de test Django

---

#### Jour 10 — Segmentation par département et personnalisation des scénarios

*Permettre des campagnes différenciées par département plutôt qu'un scénario unique envoyé à toute l'entreprise.*

**Prompt Claude Code**

```
BACKEND : ajoute un champ departement au modèle
Destinataire. Modifie le modèle Campagne pour permettre d'associer
plusieurs ScenarioPhishing à une même campagne, chacun ciblant un
ou plusieurs départements (ex. un scénario « facture fournisseur »
pour le département Comptabilité, un scénario « alerte RH » pour le
département Ressources Humaines). Adapte le service d'envoi
(EnvoiCampagneService, jour 8) pour sélectionner automatiquement le
bon scénario selon le département du destinataire au moment de
l'envoi.

FRONTEND : sur la page Générer un scénario (docs/maquettes/app.html)
et sur la modale de lancement de campagne
(docs/maquettes/campagnes.html), ajoute la possibilité d'assigner un
département à chaque groupe de destinataires et de générer un
scénario distinct par département au sein d'une même campagne.
```

**Procédure d'implémentation**

- Lancer le prompt backend ; les destinataires déjà en base reçoivent un département par défaut lors de la migration
- Envoyer la partie frontend
- Tester une campagne avec 2 départements et 2 scénarios distincts
- Vérifier que chaque destinataire reçoit bien le scénario correspondant à son département

---


### Phase 3 — Gouvernance & résultats

#### Jour 11 — Module Gouvernance — consentement et journal d'audit

*Rendre techniquement impossible le lancement d'une campagne sans consentement — le cœur du cadre éthique du projet.*

**Prompt Claude Code**

```
BACKEND : dans apps/gouvernance/, crée le modèle
Consentement (campagne FK OneToOne, responsable_nom,
responsable_email, statut [en_attente / valide / refuse],
date_validation) et JournalAudit (action, auteur FK, horodatage,
details JSONField). Ajoute une vérification explicite qui bloque
le lancement d'une campagne si aucun Consentement au statut
« valide » n'existe pour cette campagne.

FRONTEND : connecte la page Consentements (déjà maquettée dans
docs/maquettes/entreprises_consentements_parametres.html) aux
endpoints réels — liste filtrable par statut, actions Valider /
Refuser pour les demandes en attente.
```

**Procédure d'implémentation**

- Lancer le prompt backend, écrire un test qui vérifie que le lancement échoue sans consentement valide
- Envoyer la partie frontend — Claude Code lit la section Consentements du fichier de maquette
- Tester le flux complet de validation depuis l'interface
- Vérifier que chaque validation crée bien une entrée JournalAudit horodatée

---

#### Jour 12 — Score de vulnérabilité et pages Tableau de bord / Résultats

*Transformer les interactions brutes en indicateur compréhensible par un dirigeant non-technicien.*

**Prompt Claude Code**

```
BACKEND : ajoute un endpoint /api/campagnes/{id}/score/
qui calcule le taux de clic, de soumission et de signalement à
partir des Interaction enregistrées, ainsi qu'un score de
vulnérabilité composite (0-100). L'agrégation doit fonctionner
correctement même lorsqu'une campagne contient plusieurs scénarios
répartis par département (voir jour 10). Ajoute un endpoint
d'agrégation par secteur et par entreprise pour le tableau de bord
global.

FRONTEND : connecte les pages Tableau de bord (docs/maquettes/app.html)
et Résultats (docs/maquettes/resultats.html) aux données réelles
retournées par ces endpoints.
```

**Procédure d'implémentation**

- Lancer le prompt backend, valider les calculs avec un jeu de données de test connu
- Tester spécifiquement une campagne multi-départements pour confirmer que l'agrégation reste correcte
- Envoyer la partie frontend
- Comparer visuellement le rendu avec les deux fichiers de maquette pour détecter toute régression

---

#### Jour 13 — Génération de rapport PDF

*Livrer le document que le consultant remet concrètement au dirigeant client.*

**Prompt Claude Code**

```
BACKEND : ajoute apps/rapports/ avec un service
GenerationRapportService utilisant WeasyPrint pour produire un PDF
reprenant le score de vulnérabilité, les graphiques clés et les
recommandations d'une campagne clôturée. Expose un endpoint
GET /api/campagnes/{id}/rapport/ qui retourne le fichier généré.

FRONTEND : connecte la page Rapports PDF (docs/maquettes/rapports.html)
à cet endpoint — génération à la demande et téléchargement.
```

**Procédure d'implémentation**

- Lancer le prompt, générer un rapport de test et l'ouvrir pour vérifier la mise en page
- Envoyer la partie frontend
- Tester le téléchargement depuis l'interface
- Vérifier le temps de génération — objectif fixé au cahier des charges : moins de 10 secondes

---

#### Jour 14 — Templates sectoriels et Historique des campagnes

*Capitaliser sur les scénarios déjà générés plutôt que de repartir de zéro à chaque campagne.*

**Prompt Claude Code**

```
BACKEND : ajoute apps/templates_sectoriels/ avec le
modèle TemplateSectoriel (nom, secteur, prompt_structure,
nombre_utilisations) et son CRUD. Modifie le service de génération
pour permettre de partir d'un template existant. Ajoute un endpoint
d'historique par entreprise agrégeant les campagnes passées et
l'évolution du score.

FRONTEND : connecte les pages Templates sectoriels
(docs/maquettes/templates.html) et Historique
(docs/maquettes/historique.html) aux endpoints réels.
```

**Procédure d'implémentation**

- Lancer le prompt, créer 2 à 3 templates de test répartis sur plusieurs secteurs
- Vérifier que la génération à partir d'un template produit un résultat cohérent
- Envoyer la partie frontend
- Valider les deux pages avec les données réelles

---

#### Jour 15 — Vérification de fidélité visuelle (design QA)

*Corriger la dérive visuelle inévitable après 10 jours de génération de pages par IA, avant d'attaquer les dernières pages de la phase 4.*

**Prompt Claude Code**

```
Compare chaque page déjà développée (Dashboard, Générer
un scénario, Campagnes, Résultats, Rapports PDF, Historique,
Templates sectoriels) au fichier de maquette correspondant dans
docs/maquettes/. Pour chaque écart constaté — espacement, couleur,
taille de police, disposition — corrige le composant concerné pour
qu'il respecte strictement la charte graphique du projet.
```

**Procédure d'implémentation**

- Ouvrir chaque page de l'application dans le navigateur et capturer une image d'écran dans un dossier temporaire (ex. tmp/qa/)
- Lancer le prompt : Claude Code compare directement les captures et les fichiers docs/maquettes/ correspondants, sans manipulation supplémentaire
- Lister tous les écarts avant de lancer les corrections plutôt que de corriger au fil de l'eau
- Valider visuellement chaque correction avant de passer à la page suivante

---


### Phase 4 — Finalisation & livraison

#### Jour 16 — Page Paramètres (profil, sécurité, équipe, mode de génération)

*Compléter la dernière page maquettée restante, en y intégrant le choix par défaut du mode de génération (API / manuel).*

**Prompt Claude Code**

```
BACKEND : ajoute les endpoints nécessaires à la page
Paramètres — mise à jour du profil utilisateur, changement de mot
de passe, gestion des membres de l'équipe (liste, changement de
rôle), et un paramètre par instance définissant le mode de
génération par défaut (API Claude ou manuel, voir jour 7).

FRONTEND : connecte la page Paramètres (déjà maquettée dans
docs/maquettes/entreprises_consentements_parametres.html, 7 onglets)
aux endpoints réels pour les sections Profil, Sécurité, Équipe et
API/IA.
```

**Procédure d'implémentation**

- Lancer le prompt, tester chaque onglet connecté individuellement
- Envoyer la partie frontend
- Vérifier que le changement de mot de passe invalide bien les anciens tokens JWT
- Commit git : feat(parametres): profil, sécurité, équipe, mode de génération

---

#### Jour 17 — Jour tampon — rattrapage ou hygiène minimale

*Absorber un éventuel retard accumulé sur les 16 premiers jours ; à défaut de retard, consacrer le temps à une hygiène de sécurité minimale, sans viser une conformité complète — la sécurité applicative approfondie reste hors périmètre de ce sprint, par décision explicite.*

**Prompt Claude Code**

```
Si le calendrier est respecté à ce stade : vérifie que
DEBUG=False est bien appliqué en configuration de production, que
le fichier .env n'est jamais suivi par git, et que les mots de
passe sont hashés (comportement par défaut de Django à ne pas avoir
été altéré par erreur). N'entreprends aucun audit exhaustif.

Si le calendrier est en retard : n'exécute aucun nouveau prompt ce
jour ; utilise-le pour finaliser les étapes précédentes non
terminées.
```

**Procédure d'implémentation**

- Faire un point d'avancement honnête par rapport au jour 17 prévu
- Si en retard : prioriser la finalisation des fonctionnalités Must Have du cahier des charges avant tout le reste
- Si à jour : exécuter la vérification minimale ci-dessus
- Noter dans le README les limitations de sécurité connues de cette version, plutôt que de les découvrir en production

---

#### Jour 18 — Tests end-to-end

*Valider les parcours critiques automatiquement plutôt que de tout revérifier manuellement à chaque changement.*

**Prompt Claude Code**

```
Ajoute des tests end-to-end avec Playwright couvrant les
parcours critiques : connexion, création d'entreprise, génération
de scénario (mode API et mode manuel), lancement de campagne avec
consentement, consultation du tableau de bord. Configure ces tests
pour s'exécuter contre l'environnement Docker complet.
```

**Procédure d'implémentation**

- Lancer le prompt
- Exécuter la suite Playwright localement contre l'environnement Docker complet (docker compose up)
- Corriger les régressions détectées

---

#### Jour 19 — Documentation et préparation de la démonstration

*Rendre le projet livrable et compréhensible par un tiers, pas seulement fonctionnel dans ta tête.*

**Prompt Claude Code**

```
Rédige un README.md complet à la racine du projet :
présentation, prérequis (liste des logiciels à installer, voir
section 1 du présent rapport), procédure d'installation
(docker compose up -d), variables d'environnement à configurer,
structure du projet, et un rappel explicite que la délivrabilité des
emails simulés dépend de l'autorisation du domaine ou de l'adresse
IP d'envoi par l'équipe IT du client. Ajoute un guide de déploiement
séparé (docs/DEPLOIEMENT.md) destiné à cette équipe IT.
```

**Procédure d'implémentation**

- Lancer le prompt
- Suivre soi-même le README sur un environnement propre pour vérifier qu'aucune étape ne manque
- Préparer un jeu de données de démonstration réaliste (entreprise fictive, campagne multi-départements, résultats)

---

#### Jour 20 — Déploiement pilote et validation finale

*Clôturer le sprint de 20 jours sur une instance réellement déployée, pas seulement en local.*

**Prompt Claude Code**

```
Vérifie que docker compose up -d démarre l'ensemble de
la plateforme sans erreur sur un environnement propre, que les
migrations s'appliquent automatiquement au démarrage, et qu'un
compte administrateur peut être créé via une commande de gestion
dédiée plutôt que manuellement en base de données.
```

**Procédure d'implémentation**

- Déployer sur le VPS de test / démonstration prévu au budget
- Dérouler le scénario de démonstration complet de bout en bout, y compris une campagne multi-départements
- Lister les écarts restants et les documenter comme limitations connues plutôt que de les corriger dans l'urgence

---

## 6. Risques et indicateurs de suivi

### 6.1 Risques spécifiques à ce sprint révisé

| Risque | Impact | Mitigation |
|---|---|---|
| Sécurité applicative non approfondie (Top 10 OWASP hors périmètre) | Élevé | Vérification minimale au jour 17 ; documenter explicitement cette limitation avant tout déploiement au-delà du pilote |
| Dérive visuelle par rapport aux maquettes, accumulée sur 20 jours de génération IA | Moyen | Layout de référence unique dès le jour 4, maquettes référencées par chemin de fichier à chaque prompt frontend, jour 15 dédié à la correction |
| Délivrabilité des emails simulés dépendante d'une configuration DNS hors du contrôle du projet (SPF/DKIM du client) | Moyen | Documenté explicitement dans le guide de déploiement (jour 19) comme prérequis côté client, pas comme un défaut applicatif |
| Limites d'usage de Claude Code liées à l'abonnement Claude Pro sur un rythme de développement quotidien intensif | Moyen | Répartir les prompts les plus longs en début de journée ; utiliser le jour 17 comme marge en cas de blocage |
| Aucune marge de rattrapage en dehors du jour 17 | Élevé | Les étapes des jours 10 (département) et 14 (templates) sont les premières sacrifiables sans remettre en cause le cœur du produit |

### 6.2 Indicateurs de suivi (KPIs)

| Indicateur | Mode de calcul | Fréquence |
|---|---|---|
| Avancement du sprint | Nombre d'étapes validées / 20 | Quotidienne |
| Fidélité visuelle | Nombre d'écarts identifiés au jour 15 / nombre de pages développées | Jour 15 |
| Couverture de test | Pourcentage de endpoints DRF couverts par un test | Jours 9, 18 |
| Respect du calendrier | Écart entre jour prévu et jour réel de validation d'une étape | Quotidienne |

---

## 7. Synthèse

Ce plan conserve la structure en 4 phases de 5 jours établie précédemment. Claude Code en ligne de commande dans VS Code simplifie la question de la fidélité visuelle : un outil avec accès au système de fichiers peut lire directement les maquettes déjà stockées dans le dépôt, sans dépendre d'une pièce jointe manuelle à chaque prompt.

La liste explicite des logiciels à installer réduit le risque de blocage en tout début de sprint. Le compromis assumé sur la sécurité applicative reste une limitation réelle du produit à ce stade, à traiter avant tout déploiement au-delà d'un client pilote.

---

*Document préparé par LEVY — IUSJC Eyang · CyberSecurity Research Laboratory (CSRL) · Yaoundé, Cameroun*
