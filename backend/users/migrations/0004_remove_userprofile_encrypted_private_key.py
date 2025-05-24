# backend/users/migrations/0004_remove_encrypted_private_key.py
# Generated manually

from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_friendrequest'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='userprofile',
            name='encrypted_private_key',
        ),
    ]