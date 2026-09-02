from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0003_demandereinitialisation"),
    ]

    operations = [
        migrations.AddField(
            model_name="utilisateur",
            name="date_changement_mot_de_passe",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
