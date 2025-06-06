from rest_framework import serializers
from .models import Message, ChatRoom
from django.contrib.auth.models import User

class ChatRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatRoom
        fields = "__all__"


class MessageSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    room_id = serializers.IntegerField(source="room.id", read_only=True)

    class Meta:
        model = Message
        fields = ['username', 'content_for_sender', 'content_for_receiver', 'timestamp', 'room_id', 'iv']
        read_only_fields = ['username', 'timestamp', 'room_id']

class MessageCreateSerializer(serializers.ModelSerializer):
    content_for_sender = serializers.CharField()
    content_for_receiver = serializers.CharField()
    iv = serializers.CharField()

    class Meta:
        model = Message
        fields = ['content_for_sender', 'content_for_receiver','iv']

    def validate(self, data):
        if not data.get('content_for_sender') or not data.get('content_for_receiver'):
            raise serializers.ValidationError("Both encrypted contents are required.")
        return data

    def create(self, validated_data):
        return Message.objects.create(**validated_data)