import uuid
from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError

class ChatRoom(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user1 = models.ManyToManyField(User, related_name="chat_rooms",blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        if self.pk and self.users.count() > 2:
            raise ValidationError("A chat room can only have 2 users.")

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.clean()
class Message(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)