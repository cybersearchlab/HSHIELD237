from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [("campagnes", "0002_scenariophishing_piece_jointe")]

    operations = [
        migrations.AddField(
            model_name="scenariophishing",
            name="expediteur_nom",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="scenariophishing",
            name="expediteur_email",
            field=models.EmailField(blank=True, default="", max_length=254),
        ),
        migrations.AddField(
            model_name="scenariophishing",
            name="destinataire_email",
            field=models.EmailField(blank=True, default="", max_length=254),
        ),
        migrations.AddField(
            model_name="scenariophishing",
            name="est_html",
            field=models.BooleanField(default=False),
        ),
    ]
