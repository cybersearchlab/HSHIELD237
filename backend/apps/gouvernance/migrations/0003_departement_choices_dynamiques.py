from django.db import migrations, models


class Migration(migrations.Migration):
    """Retire choices= de ResponsableDepartement.departement — la validité
    du code est désormais vérifiée en live contre le registre
    DepartementConfigure (apps.campagnes) plutôt que par une énumération
    figée. Aucun changement de données, `unique=True` conservé."""

    dependencies = [
        ("gouvernance", "0002_responsabledepartement_and_more"),
        ("campagnes", "0006_departement_registry"),
    ]

    operations = [
        migrations.AlterField(
            model_name="responsabledepartement",
            name="departement",
            field=models.CharField(max_length=30, unique=True),
        ),
    ]
