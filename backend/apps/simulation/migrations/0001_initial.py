import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("campagnes", "0003_scenario_expediteur_destinataire_html"),
    ]

    operations = [
        migrations.CreateModel(
            name="ConfigurationEnvoi",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("expediteur_nom", models.CharField(blank=True, default="", max_length=255)),
                ("expediteur_email", models.EmailField(blank=True, default="", max_length=254)),
                ("reply_to", models.EmailField(blank=True, default="", max_length=254)),
                (
                    "delai_entre_envois",
                    models.PositiveIntegerField(
                        default=2, help_text="Secondes minimales entre deux envois consécutifs"
                    ),
                ),
                (
                    "campagne",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="configuration_envoi",
                        to="campagnes.campagne",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="EnvoiTracking",
            fields=[
                (
                    "id",
                    models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False),
                ),
                ("destinataire_email", models.EmailField(max_length=254)),
                ("date_envoi", models.DateTimeField(auto_now_add=True)),
                (
                    "scenario",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="envois",
                        to="campagnes.scenariophishing",
                    ),
                ),
            ],
            options={
                "ordering": ["-date_envoi"],
            },
        ),
    ]
