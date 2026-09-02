from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [("simulation", "0002_interaction")]

    operations = [
        migrations.AddField(
            model_name="interaction",
            name="champs_renseignes",
            field=models.JSONField(blank=True, null=True),
        ),
    ]
