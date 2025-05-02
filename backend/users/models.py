from django.contrib.auth.models import User
from django.db import models

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    friends = models.ManyToManyField('self', symmetrical=False, blank=True)
    name = models.CharField(max_length=120,null=True,blank=True)
    surname = models.CharField(max_length=120,null=True,blank=True)
    def __str__(self):
        return self.user.username