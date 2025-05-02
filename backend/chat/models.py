from django.db import models
from django.contrib.auth.models import User

class ChatRoom(models.Model):
    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chatrooms_as_user1',null=True,blank=True)
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chatrooms_as_user2',null=True,blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Message(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)