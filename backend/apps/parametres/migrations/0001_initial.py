from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="ParametreExterne",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "cle",
                    models.CharField(
                        choices=[
                            ("ANTHROPIC_API_KEY", "ANTHROPIC_API_KEY"),
                            ("ANTHROPIC_MODEL", "ANTHROPIC_MODEL"),
                            ("EMAIL_HOST", "EMAIL_HOST"),
                            ("EMAIL_PORT", "EMAIL_PORT"),
                            ("EMAIL_HOST_USER", "EMAIL_HOST_USER"),
                            ("EMAIL_HOST_PASSWORD", "EMAIL_HOST_PASSWORD"),
                            ("EMAIL_USE_TLS", "EMAIL_USE_TLS"),
                            ("SIMULATION_BASE_URL", "SIMULATION_BASE_URL"),
                        ],
                        max_length=50,
                        unique=True,
                    ),
                ),
                ("valeur_chiffree", models.TextField(blank=True)),
                ("date_maj", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ["cle"],
            },
        ),
    ]
