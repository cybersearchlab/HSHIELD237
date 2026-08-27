import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("campagnes", "0004_destinataire_departements_cibles"),
    ]

    operations = [
        migrations.AddField(
            model_name="scenariophishing",
            name="date_creation",
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AlterModelOptions(
            name="scenariophishing",
            options={"ordering": ["-date_creation"]},
        ),
    ]
