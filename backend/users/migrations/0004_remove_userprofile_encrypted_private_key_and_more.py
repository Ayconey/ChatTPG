# Generated by Django 4.2.20 on 2025-05-26 09:50

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0003_friendrequest"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="userprofile",
            name="encrypted_private_key",
        ),
        migrations.RemoveField(
            model_name="userprofile",
            name="name",
        ),
        migrations.RemoveField(
            model_name="userprofile",
            name="surname",
        ),
    ]
