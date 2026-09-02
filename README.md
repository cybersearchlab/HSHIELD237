# H-SHIELD237

Plateforme camerounaise de simulation de phishing à but de sensibilisation
(security awareness training) — permet à un consultant de générer, envoyer
et suivre des campagnes de phishing simulé auprès des employés d'une
entreprise cliente, dans un cadre de gouvernance qui exige un consentement
validé avant tout envoi.

Développée dans le cadre d'un sprint de finalisation de 20 jours (14 août
→ 2 septembre 2026, IUSJC Eyang · CyberSecurity Research Laboratory) —
voir `docs/rapport_planification.md` pour le détail jour par jour, et
`docs/CONTEXTE_PROJET.md` pour le journal complet des décisions prises en
cours de route.

> **Ce README est un premier jet.** Les instructions complètes
> d'installation, de configuration et de déploiement sont prévues au
> Jour 19 du sprint (`docs/DEPLOIEMENT.md`, à venir). Cette version se
> concentre sur les limitations de sécurité connues de la plateforme —
> à documenter *avant* tout déploiement au-delà d'un usage local/pilote,
> plutôt que de les découvrir en production.

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
  client** — H-SHIELD237 ne peut pas garantir qu'un email simulé évite
  les filtres anti-spam si cette configuration n'est pas en place côté
  client (voir le guide de déploiement à venir, Jour 19).

## Statut du projet

Sprint en cours — voir `docs/CONTEXTE_PROJET.md`, section « État
d'avancement », pour le point le plus à jour, et « Prochaine action
précise » pour la suite prévue.
