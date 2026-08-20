import django.contrib.postgres.fields
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("campagnes", "0003_scenario_expediteur_destinataire_html"),
    ]

    operations = [
        migrations.AddField(
            model_name="scenariophishing",
            name="departements_cibles",
            field=django.contrib.postgres.fields.ArrayField(
                base_field=models.CharField(
                    choices=[
                        ("direction", "Direction générale"),
                        ("rh", "Ressources humaines"),
                        ("comptabilite", "Comptabilité / Finance"),
                        ("it", "Informatique"),
                        ("commercial", "Commercial / Ventes"),
                        ("juridique", "Juridique"),
                        ("marketing", "Marketing / Communication"),
                        ("production", "Production / Opérations"),
                        ("achats", "Achats / Logistique"),
                        ("autre", "Autre"),
                    ],
                    max_length=20,
                ),
                blank=True,
                default=list,
                help_text=(
                    "Départements ciblés par ce scénario au sein de sa campagne. "
                    "Vide = scénario générique, utilisé par défaut pour tout "
                    "destinataire dont le département n'est ciblé par aucun autre "
                    "scénario de la campagne."
                ),
                size=None,
            ),
        ),
        migrations.CreateModel(
            name="Destinataire",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("email", models.EmailField(max_length=254)),
                (
                    "departement",
                    models.CharField(
                        choices=[
                            ("direction", "Direction générale"),
                            ("rh", "Ressources humaines"),
                            ("comptabilite", "Comptabilité / Finance"),
                            ("it", "Informatique"),
                            ("commercial", "Commercial / Ventes"),
                            ("juridique", "Juridique"),
                            ("marketing", "Marketing / Communication"),
                            ("production", "Production / Opérations"),
                            ("achats", "Achats / Logistique"),
                            ("autre", "Autre"),
                        ],
                        max_length=20,
                    ),
                ),
                (
                    "campagne",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="destinataires",
                        to="campagnes.campagne",
                    ),
                ),
            ],
            options={
                "ordering": ["email"],
                "unique_together": {("campagne", "email")},
            },
        ),
    ]
