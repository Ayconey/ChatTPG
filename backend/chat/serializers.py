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
        fields = ['id', 'username', 'content', 'timestamp', 'room_id']
        read_only_fields = ['id', 'timestamp']

    def validate_content(self, value):
        # Możesz dodać walidację dla content (np. minimalna długość, itp.)
        if len(value.strip()) == 0:
            raise serializers.ValidationError("Content cannot be empty.")
        return value

    def create(self, validated_data):
        # Pobierz dane z validated_data
        username = validated_data.get('username')
        content = validated_data.get('content')
        room_id = validated_data.get('room_id')

        # Pobierz obiekt użytkownika na podstawie username
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise serializers.ValidationError(f"User with username {username} does not exist.")
        
        try:
            room = ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            raise serializers.ValidationError(f"Room with id {room_id} does not exist.")

        # Tworzenie wiadomości
        message = Message.objects.create(user=user, room=room, content=content)
        return message