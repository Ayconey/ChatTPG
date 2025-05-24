# users/signals.py
from django.db.models.signals import post_save
from django.contrib.auth.models import User
from django.dispatch import receiver
from .models import UserProfile

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        # Sprawdź czy profile już istnieje (może być utworzony przez serializer)
        if not UserProfile.objects.filter(user=instance).exists():
            UserProfile.objects.create(user=instance)
            print(f"📝 Signal created empty profile for: {instance.username}")
        else:
            print(f"📝 Profile already exists for: {instance.username}")