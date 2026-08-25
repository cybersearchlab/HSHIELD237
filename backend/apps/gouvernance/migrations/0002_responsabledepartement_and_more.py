import django.contrib.postgres.fields
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

MOTIF_REFUS_CHOICES = [
    ("perimetre_trop_large", "Le périmètre testé est trop large"),
    ("timing_inapproprie", "Le moment choisi n'est pas approprié"),
    ("scenario_inadapte", "Le scénario n'est pas adapté à ce département"),
    ("infos_insuffisantes", "Informations insuffisantes pour valider en connaissance de cause"),
    ("autre", "Autre motif (préciser)"),
]


class Migration(migrations.Migration):

    dependencies = [
        ("gouvernance", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="ResponsableDepartement",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("departement", models.CharField(choices=DEPARTEMENT_CHOICES, max_length=20, unique=True)),
                ("nom", models.CharField(max_length=255)),
                ("email", models.EmailField(max_length=254)),
                ("date_maj", models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.AddField(
            model_name="consentement",
            name="motifs_refus",
            field=django.contrib.postgres.fields.ArrayField(
                base_field=models.CharField(choices=MOTIF_REFUS_CHOICES, max_length=30),
                default=list,
                blank=True,
                size=None,
            ),
        ),
        migrations.AddField(
            model_name="consentement",
            name="motif_refus_details",
            field=models.TextField(blank=True, default=""),
            preserve_default=False,
        ),
    ]
