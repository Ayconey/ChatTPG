from rest_framework import serializers
from .models import Message, User, ChatRoom

class ChatRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatRoom
        fields = "__all__"


class MessageSerializer(serializers.ModelSerializer):
    user_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    room_id = serializers.PrimaryKeyRelatedField(queryset=ChatRoom.objects.all())

    class Meta:
        model = Message
        fields = ['user_id', 'room_id', 'content']
        read_only_fields = ['timestamp']
