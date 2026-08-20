import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("simulation", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Interaction",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "type",
                    models.CharField(
                        choices=[
                            ("ouverture", "Ouverture"),
                            ("clic", "Clic"),
                            ("soumission", "Soumission"),
                            ("signalement", "Signalement"),
                        ],
                        max_length=20,
                    ),
                ),
                ("horodatage", models.DateTimeField(auto_now_add=True)),
                ("adresse_ip", models.GenericIPAddressField(blank=True, null=True)),
                (
                    "envoi",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="interactions",
                        to="simulation.envoitracking",
                    ),
                ),
            ],
            options={
                "ordering": ["-horodatage"],
            },
        ),
    ]
