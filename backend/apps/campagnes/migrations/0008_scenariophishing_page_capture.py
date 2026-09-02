from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [("campagnes", "0007_departement_choices_dynamiques")]

    operations = [
        migrations.AddField(
            model_name="scenariophishing",
            name="page_capture_html",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="scenariophishing",
            name="page_capture_date_maj",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
