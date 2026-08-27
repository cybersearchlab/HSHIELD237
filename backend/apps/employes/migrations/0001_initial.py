from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("campagnes", "0006_departement_registry"),
    ]

    operations = [
        migrations.CreateModel(
            name="Employe",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("nom", models.CharField(max_length=255)),
                ("email", models.EmailField(max_length=254, unique=True)),
                ("departement", models.CharField(max_length=30)),
                ("date_creation", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "ordering": ["nom"],
            },
        ),
    ]
