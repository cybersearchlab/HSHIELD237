# H-SHIELD237

Plateforme camerounaise de simulation de phishing à but de sensibilisation
(security awareness training) — permet à un consultant de générer,
envoyer et suivre des campagnes de phishing simulé auprès des employés
d'une entreprise cliente, dans un cadre de gouvernance qui exige un
consentement explicite et validé avant tout envoi.

Développée dans le cadre d'un sprint de finalisation de 20 jours (14 août
→ 2 septembre 2026, IUSJC Eyang · CyberSecurity Research Laboratory) —
voir `docs/rapport_planification.md` pour le détail jour par jour, et
`docs/CONTEXTE_PROJET.md` pour le journal complet des décisions prises en
cours de route.

## Fonctionnalités principales

- **Génération de scénarios de phishing** — par IA (API Claude,
  contextualisée au marché camerounais) ou saisie manuelle (texte déjà
  rédigé, sans dépendre d'une clé API).
- **Campagnes segmentées par département**, avec annuaire des employés et
  envoi individuel ciblé (jamais une adresse de diffusion visible par
  tous les destinataires).
- **Gouvernance intégrée** — aucune campagne ne peut être lancée sans
  consentement explicite validé par le responsable désigné du
  département concerné ; journal d'audit des actions sensibles.
- **Suivi des interactions** — ouverture (pixel), clic, soumission sur
  une fausse page de capture (générique par défaut, ou personnalisée par
  le consultant), avec score de vulnérabilité composite.
- **Rapports PDF**, tableau de bord, historique par département.
- **Paramètres applicatifs** — profil, sécurité, gestion de l'équipe,
  clés API/services externes — pilotables depuis l'application, sans
  toucher aux fichiers de configuration après le déploiement initial.

## Prérequis

Cette liste concerne la machine de développement — à distinguer de ce qui
tourne à l'intérieur des conteneurs Docker en production (voir
`docs/DEPLOIEMENT.md` pour l'équipe qui héberge la plateforme).

| Logiciel | Usage |
|---|---|
| Git | Gestion de version. |
| Node.js LTS (20+) | Développement du frontend React/Vite, et exécution des tests end-to-end (`e2e/`) depuis l'hôte. |
| Python 3.12 | Développement local du backend Django hors conteneur (autocomplétion, migrations, tests rapides). |
| Docker Desktop | Construit et orchestre les conteneurs du projet (`db`, `backend`, `frontend`, `nginx`) définis dans `docker-compose.yml`. |
| WSL2 (Windows) | Backend requis par Docker Desktop sous Windows. |
| Un client PostgreSQL (psql, pgAdmin, DBeaver) | Pour inspecter directement les tables de la base — le serveur PostgreSQL complet n'a pas besoin d'être installé en local, il tourne déjà dans Docker. |

Détail complet des prérequis et de l'ordre d'installation conseillé :
voir `docs/rapport_planification.md`, section 1.

## Installation et démarrage

```bash
git clone <url-du-depot> hshield237
cd hshield237
cp .env.example .env
# Renseigner .env — voir « Variables d'environnement » ci-dessous.

docker compose up -d
docker compose ps      # les 4 services doivent afficher "healthy"
```

L'application est alors accessible sur `https://localhost` (certificat
TLS auto-signé en développement — voir `nginx/certs/README.md` pour en
générer un, ou `docs/DEPLOIEMENT.md` pour un certificat réel en
production). Les migrations s'appliquent automatiquement au démarrage du
service `backend`.

**Premier compte administrateur** — aucun compte n'existe par défaut :

```bash
docker compose exec backend python manage.py createsuperuser
```

`createsuperuser` crée un compte technique (`is_staff`/`is_superuser`)
mais **ne lui donne pas automatiquement le rôle applicatif
« administrateur »** (champ `role`, distinct des droits Django) —
complétez ensuite :

```bash
docker compose exec backend python manage.py shell -c "
from apps.accounts.models import Utilisateur, Role
u = Utilisateur.objects.get(email='<email-saisi-a-l-instant>')
u.role = Role.ADMINISTRATEUR
u.save(update_fields=['role'])
"
```

Ce compte peut ensuite créer les autres comptes (consultant, responsable,
administrateur) directement depuis l'application — Paramètres > Équipe.

**Docker Desktop, premier démarrage** : un ralentissement notable
(`WORKER TIMEOUT` côté backend, ou récupération WAL de PostgreSQL après
un arrêt non propre) est possible sur les toutes premières minutes —
il se résorbe automatiquement ; `docker compose restart backend` en cas
de doute persistant (voir `docs/CONTEXTE_PROJET.md`, « Bugs connus »).

## Variables d'environnement (`.env`, jamais commité)

Voir `.env.example` pour le fichier de référence complet (valeurs
d'exemple, sans secret réel). Résumé :

| Variable | Rôle |
|---|---|
| `SECRET_KEY` | Clé secrète Django — générer une valeur unique par environnement, jamais réutiliser celle d'exemple. |
| `DEBUG` | `False` en production, toujours (vérifié — voir « Limitations connues » ci-dessous). |
| `ALLOWED_HOSTS` | Domaine(s) réel(s) de la plateforme, séparés par virgule. |
| `CORS_ALLOWED_ORIGINS` | Origine(s) autorisée(s) pour le frontend (généralement le même domaine, en `https://`). |
| `DATABASE_URL`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | Connexion PostgreSQL (service `db` du `docker-compose.yml`). |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | Génération de scénario par IA (console.anthropic.com — indépendant de tout abonnement Claude utilisé pour développer le projet). Peut rester vide : le mode manuel fonctionne sans elle. |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS` | Compte SMTP utilisé pour l'envoi des campagnes — **jamais un serveur auto-hébergé** ; voir le rappel de délivrabilité ci-dessous. |
| `SIMULATION_BASE_URL` | URL publique de base utilisée pour construire les liens de la fausse page de capture insérés dans les emails simulés — doit correspondre au domaine réel accessible par les destinataires. |
| `VITE_API_BASE_URL` | Base des appels API côté frontend (`/api` par défaut, relatif — ne change généralement pas). |

Ces mêmes réglages `ANTHROPIC_API_KEY`/`ANTHROPIC_MODEL`/`EMAIL_*` sont
aussi modifiables **après coup**, directement depuis l'application
(Paramètres > API & IA, administrateur uniquement) — la valeur saisie
là prime alors sur celle de `.env`.

## Structure du projet

```
hshield237/
├── docker-compose.yml
├── .env.example
├── README.md                    (ce fichier)
├── docs/
│   ├── rapport_planification.md (plan détaillé des 20 jours du sprint)
│   ├── CONTEXTE_PROJET.md       (journal complet des décisions)
│   ├── DEPLOIEMENT.md           (guide pour l'équipe IT du client)
│   ├── charte_graphique.html
│   └── maquettes/                (une maquette HTML par page)
├── backend/                      (Django + Django REST Framework)
│   ├── config/settings/          (base.py, dev.py, prod.py)
│   └── apps/
│       ├── accounts/              (comptes, rôles, JWT, équipe)
│       ├── campagnes/              (Campagne, ScenarioPhishing, départements)
│       ├── generation/             (génération IA + mode manuel)
│       ├── simulation/             (envoi SMTP, tracking, fausse page)
│       ├── gouvernance/            (consentement, journal d'audit)
│       ├── rapports/               (génération PDF)
│       ├── templates_departement/  (templates de scénario réutilisables)
│       ├── employes/               (annuaire des employés)
│       └── parametres/             (clés API/services externes)
├── frontend/                     (React + Vite)
│   └── src/pages/                 (une page par écran de l'application)
├── nginx/                        (reverse proxy, terminaison TLS)
└── e2e/                          (tests end-to-end Playwright — voir e2e/README.md)
```

## Rappel important — délivrabilité des emails simulés

**La plateforme ne peut pas, à elle seule, garantir qu'un email simulé
échappe aux filtres anti-spam du destinataire.** La délivrabilité dépend
entièrement de l'autorisation du domaine ou de l'adresse IP d'envoi par
l'équipe IT du client — configuration DNS (enregistrements SPF, DKIM,
DMARC) sur le domaine d'envoi utilisé, et éventuellement mise en liste
blanche du service SMTP ou de l'adresse IP sortante auprès de la
passerelle de messagerie de l'entreprise cliente. **C'est un prérequis
côté client, pas un défaut applicatif** — voir `docs/DEPLOIEMENT.md`
pour le détail destiné à l'équipe IT chargée de cette autorisation.

## Limitations de sécurité connues

**Décision assumée dès la planification du sprint** : un audit de
sécurité applicatif approfondi (Top 10 OWASP) est **hors périmètre** de
ce sprint de 20 jours (voir `docs/rapport_planification.md`, section 6.1).
Ce qui suit n'est donc pas une liste exhaustive de vulnérabilités, mais
les points identifiés en cours de développement — à traiter avant tout
déploiement au-delà d'un client pilote encadré.

### Vérifié et sain (contrôle minimal, Jour 17 du plan)

- `DEBUG = False` appliqué explicitement en configuration de production
  (`backend/config/settings/prod.py`), `ALLOWED_HOSTS`/`CORS_ALLOWED_ORIGINS`
  exclusivement pilotés par variables d'environnement.
- `.env` n'est jamais suivi par Git (`.gitignore`) ; aucun secret n'a été
  committé (`git log` complet vérifié) — seul `.env.example` (sans
  valeurs réelles) est versionné.
- Les mots de passe sont hachés par le mécanisme par défaut de Django
  (PBKDF2), jamais altéré (`AUTH_PASSWORD_HASHERS` non redéfini) — vérifié
  directement en base sur un compte réel.

### Points à connaître avant un déploiement au-delà d'un pilote encadré

- **Aucune protection contre les tentatives de connexion répétées.**
  Ni le endpoint de connexion (`/api/auth/login/`) ni celui de mot de
  passe oublié (`/api/auth/mot-de-passe-oublie/`) ne sont limités en
  débit (`django-axes` ou équivalent non installé) — un compte peut en
  théorie être attaqué par force brute sans blocage automatique.
- **La « liste blanche de destinataires validée » (REQ-F-03 du cahier
  des charges) n'est pas verrouillée côté serveur.** L'écran utilisé en
  pratique restreint bien l'envoi à l'annuaire des employés du
  département concerné, mais l'API d'envoi
  (`POST /api/simulation/campagnes/<id>/envoyer/`) accepte encore un
  champ `destinataires` en texte libre, hérité du comportement des
  Jours 8-9, sans contrôle contre une liste pré-approuvée. Un appel
  direct à l'API (hors interface) pourrait donc encore cibler une
  adresse arbitraire.
- **La fausse page de capture personnalisée accepte du HTML/JavaScript
  arbitraire.** Depuis le 2 septembre 2026, un consultant ou un
  administrateur peut fournir le HTML complet d'une page publique,
  servie sans authentification à quiconque clique le lien. Ce HTML n'est
  ni assaini ni limité en capacités (un script arbitraire peut y
  figurer) — la seule protection est la confiance placée dans les
  comptes autorisés à le faire (consultant/administrateur). Un compte de
  ce niveau compromis pourrait publier une page malveillante au-delà du
  strict cadre de simulation prévu.
- **Les pièces jointes de scénario (`ScenarioPhishing.piece_jointe`) ne
  sont soumises à aucune validation** de type de fichier ni de taille —
  n'importe quel fichier, de n'importe quelle taille, peut être joint
  puis envoyé par email à de vrais employés testés.
- **`/admin/` (interface d'administration Django) est exposée par
  défaut**, à la même adresse dans tous les environnements — protégée
  uniquement par les identifiants du compte, sans restriction d'IP ni
  double authentification.
- **Le suivi d'ouverture par pixel invisible est intrinsèquement
  incomplet**, pas seulement en pratique H-SHIELD237 : de nombreux
  clients de messagerie professionnels bloquent le chargement des images
  par défaut, ce qui sous-estime mécaniquement le taux d'ouverture réel
  — le clic et la soumission, eux, sont fiables à 100 % (déclenchés par
  une action explicite de la personne testée).
- **La délivrabilité des emails simulés dépend entièrement de la
  configuration DNS (SPF, DKIM, DMARC) du domaine d'envoi choisi par le
  client** — voir le rappel dédié ci-dessus et `docs/DEPLOIEMENT.md`.

## Tests

- **Backend** : `docker compose exec backend python manage.py test` —
  suite Django/DRF, exécutée dans le conteneur.
- **End-to-end (Playwright)** : voir `e2e/README.md` — parcours
  critiques (connexion, campagne, génération de scénario, consentement,
  lancement, tableau de bord), exécutés contre l'environnement Docker
  complet déjà démarré (`docker compose up -d` au préalable).

## Points de configuration à vérifier avant une démonstration

- **`ANTHROPIC_API_KEY` (`.env`) n'est, à ce jour, jamais qu'un
  placeholder** (`sk-ant-xxxxx`) — jamais remplacé par une vraie clé
  depuis sa mise en place au Jour 7. Le mode API de génération de
  scénario échoue donc systématiquement (`401`) tant qu'une clé réelle
  n'est pas provisionnée sur console.anthropic.com ; le mode manuel
  (coller un texte déjà rédigé) reste pleinement utilisable sans elle.
- **L'annuaire des employés (`/employes`) est vide par défaut** — à
  peupler (au moins un employé par département testé) avant de pouvoir
  lancer une campagne.

## Statut du projet

Sprint en cours — voir `docs/CONTEXTE_PROJET.md`, section « État
d'avancement », pour le point le plus à jour, et « Prochaine action
précise » pour la suite prévue.
