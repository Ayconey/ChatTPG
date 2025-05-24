# backend/chat/models.py
from django.db import models
from django.contrib.auth.models import User


class ChatRoom(models.Model):
    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chatrooms_as_user1', null=True, blank=True)
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chatrooms_as_user2', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Message(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE)

    # Zaszyfrowana wiadomość - przechowujemy dwie wersje
    encrypted_content_for_sender = models.TextField()  # zaszyfrowana kluczem nadawcy (dla historii)
    encrypted_content_for_receiver = models.TextField()  # zaszyfrowana kluczem odbiorcy

    timestamp = models.DateTimeField(auto_now_add=True)