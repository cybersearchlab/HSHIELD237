import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("campagnes", "0004_destinataire_departements_cibles"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Consentement",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("responsable_nom", models.CharField(max_length=255)),
                ("responsable_email", models.EmailField(max_length=254)),
                (
                    "statut",
                    models.CharField(
                        choices=[
                            ("en_attente", "En attente"),
                            ("valide", "Validé"),
                            ("refuse", "Refusé"),
                        ],
                        default="en_attente",
                        max_length=20,
                    ),
                ),
                ("date_validation", models.DateTimeField(blank=True, null=True)),
                (
                    "campagne",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="consentement",
                        to="campagnes.campagne",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="JournalAudit",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("action", models.CharField(max_length=255)),
                ("horodatage", models.DateTimeField(auto_now_add=True)),
                ("details", models.JSONField(blank=True, default=dict)),
                (
                    "auteur",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="actions_audit",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-horodatage"],
            },
        ),
    ]
