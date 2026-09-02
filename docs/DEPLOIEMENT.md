# Guide de déploiement — H-SHIELD237

**Destiné à l'équipe IT du client**, chargée d'héberger la plateforme et
d'autoriser l'envoi des campagnes de simulation. Ce document suppose que
vous n'avez pas participé au développement — voir `README.md` à la racine
du dépôt pour une présentation générale du projet, et
`docs/CONTEXTE_PROJET.md` pour l'historique complet des décisions si
besoin de creuser un point précis.

## 1. Ce que vous héberger

Quatre conteneurs Docker orchestrés par `docker-compose.yml`, à la racine
du dépôt :

| Service | Rôle |
|---|---|
| `nginx` | Reverse proxy, seul point d'entrée exposé publiquement (ports 80/443) ; termine le TLS et redirige tout le trafic HTTP vers HTTPS. |
| `frontend` | Application React, construite et servie en statique — jamais exposée directement, uniquement via `nginx`. |
| `backend` | API Django/DRF (Gunicorn) — sert `/api/`, `/admin/`, `/static/`, `/media/`, `/simulation/` (fausses pages de capture, pixel de suivi). |
| `db` | PostgreSQL 16, avec volume nommé persistant (`db_data`). |

Aucun de ces services n'a besoin d'être exposé individuellement — seul
`nginx` (ports 80/443) doit être joignable depuis Internet ou depuis le
réseau interne des employés testés.

## 2. Prérequis côté serveur

- Docker Engine + Docker Compose v2 (`docker compose`, pas l'ancien
  `docker-compose` séparé).
- Un nom de domaine (ou sous-domaine) pointant vers le serveur —
  nécessaire à la fois pour le certificat TLS et pour les liens de la
  fausse page de capture insérés dans les emails simulés.
- Un compte SMTP dédié pour l'envoi des campagnes (voir section 5) —
  **jamais un serveur SMTP auto-hébergé sur cette même machine**.
- Accès à la zone DNS du domaine d'envoi, pour la section 6
  (délivrabilité) — c'est le point le plus important de ce guide.

## 3. Certificat TLS

`nginx/certs/` doit contenir `fullchain.pem` et `privkey.pem` (voir
`nginx/certs/README.md`, qui documente aussi la génération d'un
certificat auto-signé — **à ne jamais utiliser au-delà d'un pilote
interne**, il ne sera pas reconnu par un vrai client de messagerie ni un
navigateur externe). En production, générez un certificat réel pour votre
domaine (Let's Encrypt/`certbot`, ou l'autorité de certification déjà
utilisée par votre organisation) et placez les deux fichiers ici.

## 4. Configuration (`.env`)

Copiez `.env.example` vers `.env` à la racine du dépôt et renseignez
chaque variable — voir `README.md`, section « Variables
d'environnement » pour le détail de chacune. Points spécifiques à la
production :

- **`SECRET_KEY`** : générez une valeur unique et longue, jamais
  réutilisée d'un environnement à l'autre (ex.
  `python -c "import secrets; print(secrets.token_urlsafe(50))"`).
- **`DEBUG=False`** — déjà la valeur par défaut de `.env.example`, ne
  jamais la repasser à `True` en production.
- **`ALLOWED_HOSTS`** et **`CORS_ALLOWED_ORIGINS`** : le(s) domaine(s)
  réel(s) de la plateforme (ex. `hshield237.votre-domaine.cm`), jamais
  `*` ni `localhost`.
- **`SIMULATION_BASE_URL`** : doit correspondre exactement au domaine
  public par lequel les employés testés accéderont aux liens des emails
  simulés (ex. `https://hshield237.votre-domaine.cm`) — un mauvais
  réglage ici casse le suivi des clics/soumissions, silencieusement.
- **`POSTGRES_PASSWORD`** : un mot de passe fort, dédié à cet
  environnement.
- Les identifiants `ANTHROPIC_API_KEY`/`EMAIL_*` peuvent être laissés
  vides au premier déploiement et complétés ensuite **depuis
  l'application elle-même** (Paramètres > API & IA, une fois le premier
  compte administrateur créé — voir section 7) plutôt que par un nouvel
  éditeur de `.env` à chaque changement.

## 5. Démarrage

```bash
docker compose up -d
docker compose ps        # les 4 services doivent afficher "healthy"
```

Les migrations de base de données s'appliquent automatiquement au
démarrage du service `backend` — aucune commande manuelle nécessaire pour
un premier déploiement sur une base vide.

**Premier démarrage plus lent que d'habitude** (le temps que Postgres
initialise son volume, que Gunicorn démarre ses workers) : normal,
patientez quelques minutes avant de s'inquiéter d'un service qui reste
`starting`. En cas de doute persistant : `docker compose logs backend`
et/ou `docker compose restart backend`.

## 6. Délivrabilité des emails simulés — **prérequis côté client, à traiter avant toute campagne réelle**

**La plateforme ne peut pas, à elle seule, garantir qu'un email simulé
échappe aux filtres anti-spam des destinataires.** C'est le point le
plus fréquemment sous-estimé d'un déploiement : sans l'autorisation
explicite du domaine ou de l'adresse IP d'envoi par votre équipe IT, la
quasi-totalité des campagnes finiront en spam ou seront purement et
simplement rejetées par la passerelle de messagerie de l'entreprise
cliente — invalidant la mesure elle-même (un email jamais reçu ne peut
pas être cliqué). À faire, **avant** la première campagne réelle :

1. **Choisir le domaine d'envoi** utilisé pour l'expéditeur affiché des
   campagnes (configuré par campagne, voir Campagnes > Lancer une
   campagne) — idéalement un sous-domaine dédié à la sensibilisation
   (ex. `simulation.votre-domaine.cm`), pas le domaine de messagerie de
   production de l'entreprise.
2. **Enregistrements DNS à publier sur ce domaine** :
   - **SPF** — autorise explicitement le service SMTP utilisé (voir
     `EMAIL_HOST` dans `.env`) à envoyer pour ce domaine.
   - **DKIM** — signature cryptographique des emails sortants ; la
     plupart des fournisseurs SMTP transactionnels fournissent la clé
     publique à publier et gèrent la signature côté serveur.
   - **DMARC** — politique de vérification s'appuyant sur SPF/DKIM ;
     commencer par une politique `p=none` (observation) avant de
     durcir, une fois la délivrabilité confirmée stable.
3. **Mise en liste blanche côté client testé**, si l'entreprise cliente
   dispose de sa propre passerelle anti-spam (ex. Microsoft Defender,
   Proofpoint, Mimecast) : demander à son équipe IT d'autoriser le
   domaine ou l'adresse IP sortante du service SMTP utilisé, le temps de
   la campagne — sans quoi même un domaine parfaitement authentifié
   (SPF/DKIM/DMARC en ordre) peut être filtré par une politique interne
   plus stricte.
4. **Tester avant une vraie campagne** : envoyer une campagne à une
   adresse de test que vous contrôlez, dans le même environnement de
   messagerie que les employés réellement ciblés, et vérifier la
   réception (boîte de réception, pas seulement les indésirables).

Ce point est documenté comme un **prérequis côté client**, pas comme un
défaut applicatif — voir aussi `README.md`, section « Limitations de
sécurité connues », qui rappelle que le suivi d'ouverture par pixel
reste, lui, intrinsèquement partiel même une fois la délivrabilité
acquise (de nombreux clients de messagerie bloquent le chargement
d'images par défaut).

## 7. Premier compte administrateur

Aucun compte n'existe par défaut après un déploiement sur une base vide.

```bash
docker compose exec backend python manage.py createsuperuser
```

Cette commande crée un compte technique Django (accès à `/admin/`) mais
**ne lui attribue pas automatiquement le rôle applicatif
« administrateur »** utilisé par H-SHIELD237 (champ `role`, distinct des
droits `is_staff`/`is_superuser` de Django) — complétez immédiatement
après :

```bash
docker compose exec backend python manage.py shell -c "
from apps.accounts.models import Utilisateur, Role
u = Utilisateur.objects.get(email='<email-saisi-a-l-instant>')
u.role = Role.ADMINISTRATEUR
u.save(update_fields=['role'])
"
```

Ce compte peut ensuite créer tous les autres comptes (consultant,
responsable, administrateur) directement depuis l'application —
Paramètres > Équipe — sans plus jamais avoir besoin d'un accès serveur.

## 8. Sauvegardes

Toute la donnée applicative vit dans le volume Docker nommé `db_data`
(PostgreSQL) et, dans une moindre mesure, `media_data` (pièces jointes de
scénario). Sauvegarder au minimum :

```bash
docker compose exec db pg_dump -U <POSTGRES_USER> <POSTGRES_DB> > backup.sql
```

à intégrer dans votre politique de sauvegarde habituelle (fréquence,
rétention, test de restauration) — non automatisé par ce dépôt.

## 9. Mise à jour

```bash
git pull
docker compose build
docker compose up -d
docker compose ps   # vérifier "healthy" avant de considérer la mise à jour terminée
```

Les migrations de base de données s'appliquent automatiquement au
redémarrage du service `backend`, y compris pour une mise à jour (pas
seulement un premier déploiement).

## 10. Limitations de sécurité à connaître avant un déploiement au-delà d'un pilote encadré

Un audit de sécurité applicatif approfondi est explicitement hors
périmètre du sprint de développement — voir `README.md`, section
« Limitations de sécurité connues », pour le détail complet (absence de
protection anti-force-brute sur la connexion, page de capture
personnalisée acceptant du HTML/JS non assaini, `/admin/` exposé sans
restriction supplémentaire, entre autres). À lire avant tout déploiement
destiné à plus qu'un client pilote encadré.
