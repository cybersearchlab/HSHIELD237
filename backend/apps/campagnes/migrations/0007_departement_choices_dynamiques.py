import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):
    """Retire la contrainte `choices=` figée sur les champs qui stockaient
    déjà un code de département en texte libre — la validité du code est
    désormais vérifiée en live contre le registre DepartementConfigure
    (voir 0006_departement_registry) plutôt que par une énumération figée
    dans le code. Aucun changement de type de colonne ni de données
    existantes : les CharField restent des CharField, avec les mêmes
    valeurs."""

    dependencies = [
        ("campagnes", "0006_departement_registry"),
    ]

    operations = [
        migrations.AlterField(
            model_name="campagne",
            name="departement",
            field=models.CharField(max_length=30),
        ),
        migrations.AlterField(
            model_name="destinataire",
            name="departement",
            field=models.CharField(max_length=30),
        ),
        migrations.AlterField(
            model_name="scenariophishing",
            name="departements_cibles",
            field=django.contrib.postgres.fields.ArrayField(
                base_field=models.CharField(max_length=30),
                blank=True,
                default=list,
                help_text=(
                    "Départements ciblés par ce scénario au sein de sa campagne. "
                    "Vide = scénario générique, utilisé par défaut pour tout "
                    "destinataire dont le département n'est ciblé par aucun autre "
                    "scénario de la campagne. Champ retiré de l'interface depuis "
                    "le 2026-08-21 (voir docs/CONTEXTE_PROJET.md) — non concerné "
                    "par le passage des départements en registre dynamique : les "
                    "codes ici stockés ne sont plus validés contre la liste "
                    "actuelle des départements."
                ),
                size=None,
            ),
        ),
    ]
