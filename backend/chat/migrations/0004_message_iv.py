# Generated by Django 4.2.20 on 2025-05-26 10:38

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("chat", "0003_rename_content_message_content_for_receiver_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="message",
            name="iv",
            field=models.CharField(default="", max_length=32),
        ),
    ]
