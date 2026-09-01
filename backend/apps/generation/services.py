import json

from django.conf import settings

from apps.campagnes.services import departement_label as get_departement_label

SYSTEM_PROMPT = (
    "Tu es un expert en sensibilisation à la cybersécurité pour H-SHIELD237, une plateforme "
    "camerounaise de simulation de phishing éducatif. Tu rédiges des scénarios d'email de "
    "phishing réalistes mais strictement à but pédagogique, contextualisés au marché camerounais "
    "(institutions comme la BEAC, MTN Mobile Money, Orange Money, MINESUP, ARMP, ou des "
    "fournisseurs internationaux selon le contexte). Tu réponds UNIQUEMENT avec un objet JSON "
    "valide, sans texte avant ou après, avec exactement ces clés : objet_email (string), "
    "corps_email (string, plusieurs phrases), url_fausse_page (string, une URL plausible mais "
    "fictive se terminant par .hshield237.local), secteur_cible (string, courte description du "
    "profil ciblé)."
)


class ClaudeGenerationError(Exception):
    """Levée quand la génération par l'API Claude ne peut pas aboutir."""


class ClaudeGenerationService:
    """Génère un scénario de phishing via l'API Claude (console.anthropic.com).

    Nécessite ANTHROPIC_API_KEY dans l'environnement — indépendante de
    l'abonnement Claude Pro utilisé pour Claude Code. Tant que cette clé
    n'est pas configurée, le mode manuel (voir apps.generation.views)
    reste le chemin utilisable pour produire un ScenarioPhishing.
    """

    def __init__(self, api_key=None, model=None):
        from apps.parametres.services import get_parametre

        # Priorité au réglage saisi par l'administrateur depuis l'application
        # (Paramètres > API & IA) ; repli sur .env/settings si rien n'est
        # configuré (voir apps.parametres.services.get_parametre).
        self.api_key = api_key or get_parametre("ANTHROPIC_API_KEY", settings.ANTHROPIC_API_KEY)
        self.model = model or get_parametre("ANTHROPIC_MODEL", settings.ANTHROPIC_MODEL)

    def _client(self):
        if not self.api_key:
            raise ClaudeGenerationError(
                "ANTHROPIC_API_KEY n'est pas configurée. "
                "Utilisez le mode manuel (POST /api/generation/manuel/) en attendant."
            )
        import anthropic

        return anthropic.Anthropic(api_key=self.api_key)

    def _build_prompt(self, departement, contexte_additionnel="", template=None):
        label = get_departement_label(departement)
        prompt = f"Génère un scénario de phishing ciblant le département : {label}."
        if template is not None:
            # Le template ne fournit qu'une structure de base à adapter — pas
            # un email déjà rédigé — d'où l'instruction explicite « adapte »
            # plutôt qu'une simple reprise telle quelle.
            prompt += (
                f"\nPars de la structure de scénario suivante et adapte-la au département ciblé "
                f"et au contexte additionnel éventuel, plutôt que d'en inventer une nouvelle : "
                f"{template.prompt_structure}"
            )
        if contexte_additionnel:
            prompt += f"\nContexte additionnel fourni par le consultant : {contexte_additionnel}"
        return prompt

    def generate(self, departement, contexte_additionnel="", template=None):
        client = self._client()
        try:
            response = client.messages.create(
                model=self.model,
                max_tokens=1024,
                system=SYSTEM_PROMPT,
                messages=[
                    {
                        "role": "user",
                        "content": self._build_prompt(departement, contexte_additionnel, template),
                    }
                ],
            )
        except Exception as exc:  # erreurs réseau/API Anthropic
            raise ClaudeGenerationError(f"Appel à l'API Claude impossible : {exc}") from exc

        raw_text = "".join(block.text for block in response.content if hasattr(block, "text"))
        try:
            data = json.loads(raw_text)
        except (json.JSONDecodeError, TypeError) as exc:
            raise ClaudeGenerationError("Réponse de l'API Claude illisible (JSON invalide).") from exc

        required = {"objet_email", "corps_email", "url_fausse_page", "secteur_cible"}
        missing = required - data.keys()
        if missing:
            raise ClaudeGenerationError(f"Réponse de l'API Claude incomplète (champs manquants : {missing}).")

        return {key: data[key] for key in required}
