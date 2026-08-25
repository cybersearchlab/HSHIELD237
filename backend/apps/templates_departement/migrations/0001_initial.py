from django.db import migrations, models


DEPARTEMENT_CHOICES = [
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
]


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="TemplateDepartement",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("nom", models.CharField(max_length=255)),
                ("departement", models.CharField(choices=DEPARTEMENT_CHOICES, max_length=20)),
                (
                    "prompt_structure",
                    models.TextField(
                        help_text="Base de structure fournie à l'API Claude au moment de la génération — "
                        "pas un email déjà rédigé, un guide de contenu à adapter."
                    ),
                ),
                ("nombre_utilisations", models.PositiveIntegerField(default=0)),
                ("date_creation", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "ordering": ["-date_creation"],
            },
        ),
    ]
