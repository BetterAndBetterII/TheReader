# Generated by Django 5.1.4 on 2024-12-31 12:13

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='apikey',
            name='base_url',
            field=models.CharField(default='https://api.betterspace.top', max_length=255),
        ),
    ]