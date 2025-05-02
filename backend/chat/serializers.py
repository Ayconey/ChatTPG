from rest_framework import serializers
from .models import Message, User, ChatRoom

class ChatRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatRoom
        fields = "__all__"


class MessageSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    room_id = serializers.IntegerField(source="room.id", read_only=True)

    class Meta:
        model = Message
        fields = ['username', 'content', 'timestamp', 'room_id']
        read_only_fields = ['username', 'timestamp', 'room_id']


class MessageCreateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True)
    room_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Message
        fields = ['content', 'username', 'room_id']

    def validate_content(self, value):
        if not value.strip():
            raise serializers.ValidationError("Content cannot be empty.")
        return value

    def create(self, validated_data):
        username = validated_data.pop('username')
        room_id = validated_data.pop('room_id')

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise serializers.ValidationError(f"User '{username}' not found.")

        try:
            room = ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            raise serializers.ValidationError(f"Room with id {room_id} not found.")

        return Message.objects.create(user=user, room=room, **validated_data)