import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("accounts", "0002_alter_utilisateur_email"),
    ]

    operations = [
        migrations.CreateModel(
            name="DemandeReinitialisation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("email_saisi", models.EmailField(max_length=254)),
                (
                    "statut",
                    models.CharField(
                        choices=[("en_attente", "En attente"), ("traitee", "Traitée")],
                        default="en_attente",
                        max_length=20,
                    ),
                ),
                ("date_demande", models.DateTimeField(auto_now_add=True)),
                ("date_traitement", models.DateTimeField(blank=True, null=True)),
                (
                    "traite_par",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="demandes_traitees",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "utilisateur",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="demandes_reinitialisation",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-date_demande"],
            },
        ),
    ]
