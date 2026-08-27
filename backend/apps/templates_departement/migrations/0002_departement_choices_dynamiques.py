from django.db import migrations, models


class Migration(migrations.Migration):
    """Retire choices= de TemplateDepartement.departement — la validité du
    code est désormais vérifiée en live contre le registre
    DepartementConfigure (apps.campagnes) plutôt que par une énumération
    figée. Aucun changement de données."""

    dependencies = [
        ("templates_departement", "0001_initial"),
        ("campagnes", "0006_departement_registry"),
    ]

    operations = [
        migrations.AlterField(
            model_name="templatedepartement",
            name="departement",
            field=models.CharField(max_length=30),
        ),
    ]
