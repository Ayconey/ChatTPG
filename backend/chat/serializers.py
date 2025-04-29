from rest_framework import serializers
from .models import Message, User, ChatRoom

class ChatRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatRoom
        fields = "__all__"


class MessageSerializer(serializers.ModelSerializer):
    username = serializers.SlugRelatedField(
        queryset=User.objects.all(),
        slug_field='username'
    )
    room_id = serializers.PrimaryKeyRelatedField(queryset=ChatRoom.objects.all())

    class Meta:
        model = Message
        fields = ['username', 'room_id', 'content']
        read_only_fields = ['timestamp']
