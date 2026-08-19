# Generated manually (equivalent to `makemigrations`) — voir commentaire
# dans la conversation : le montage bind ./backend:/app a ete retire de
# docker-compose.yml (instabilite Docker Desktop), donc une migration
# generee dans un conteneur --rm est perdue a sa sortie.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('campagnes', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='scenariophishing',
            name='piece_jointe',
            field=models.FileField(blank=True, null=True, upload_to='scenarios/%Y/%m/'),
        ),
    ]
