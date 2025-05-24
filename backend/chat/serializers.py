# backend/chat/serializers.py
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
        fields = [
            'username', 
            'encrypted_content_for_sender', 
            'encrypted_content_for_receiver', 
            'timestamp', 
            'room_id'
        ]
        read_only_fields = ['username', 'timestamp', 'room_id']


class MessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['encrypted_content_for_sender', 'encrypted_content_for_receiver']

    def validate_encrypted_content_for_sender(self, value):
        if not value.strip():
            raise serializers.ValidationError("Encrypted content for sender cannot be empty.")
        return value

    def validate_encrypted_content_for_receiver(self, value):
        if not value.strip():
            raise serializers.ValidationError("Encrypted content for receiver cannot be empty.")
        return value

    def create(self, validated_data):
        # `user` and `room` are injected via serializer.save(...) in the view
        return Message.objects.create(**validated_data)