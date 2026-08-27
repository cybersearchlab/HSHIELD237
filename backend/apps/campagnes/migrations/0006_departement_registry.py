from django.db import migrations, models


# Les 10 départements historiquement codés en dur dans Departement.choices
# (apps/campagnes/models.py) — seedés tels quels dans le nouveau registre
# pour que toutes les données existantes (campagnes, destinataires,
# responsables, templates déjà créés) continuent de résoudre correctement,
# sans aucune migration de données sur ces autres tables.
DEPARTEMENTS_INITIAUX = [
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


def seed_departements(apps, schema_editor):
    DepartementConfigure = apps.get_model("campagnes", "DepartementConfigure")
    for code, nom in DEPARTEMENTS_INITIAUX:
        DepartementConfigure.objects.get_or_create(code=code, defaults={"nom": nom})


def unseed_departements(apps, schema_editor):
    DepartementConfigure = apps.get_model("campagnes", "DepartementConfigure")
    codes = [code for code, _ in DEPARTEMENTS_INITIAUX]
    DepartementConfigure.objects.filter(code__in=codes).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("campagnes", "0005_scenariophishing_date_creation"),
    ]

    operations = [
        migrations.CreateModel(
            name="DepartementConfigure",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code", models.SlugField(editable=False, max_length=30, unique=True)),
                ("nom", models.CharField(max_length=100, unique=True)),
                ("date_creation", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "ordering": ["nom"],
            },
        ),
        migrations.RunPython(seed_departements, unseed_departements),
    ]
