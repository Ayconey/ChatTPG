# chat/views.py
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, NotFound

from .models import ChatRoom, Message
from .serializers import (
    ChatRoomSerializer,
    MessageSerializer,
    MessageCreateSerializer,
)
from users.auth import CookieTokenAuthentication
from django.db.models import Q
from django.contrib.auth import get_user_model

User = get_user_model()


class ChatRoomListView(generics.ListCreateAPIView):
    """
    GET  /chat/rooms/         -> list rooms the user belongs to
    POST /chat/rooms/ {user}  -> create (or return existing) DM room
    """
    authentication_classes = [CookieTokenAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = ChatRoomSerializer

    def get_queryset(self):
        user = self.request.user
        return ChatRoom.objects.filter(Q(user1=user) | Q(user2=user))

    def create(self, request, *args, **kwargs):
        other_username = request.data.get("username")
        if not other_username:
            return Response(
                {"detail": "username required"}, status=status.HTTP_400_BAD_REQUEST
            )

        if other_username == request.user.username:
            raise PermissionDenied("Cannot create a room with yourself")

        try:
            other_user = User.objects.get(username=other_username)
        except User.DoesNotExist:
            raise NotFound("User not found")

        room, _ = ChatRoom.objects.get_or_create(
            user1=min(request.user, other_user, key=lambda u: u.id),
            user2=max(request.user, other_user, key=lambda u: u.id),
        )
        serializer = self.get_serializer(room)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MessageListView(generics.ListCreateAPIView):
    """
    GET  /chat/messages/<room_id>/         -> list messages in that room
    POST /chat/messages/<room_id>/ {text}  -> send a message
    """
    authentication_classes = [CookieTokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return MessageCreateSerializer if self.request.method == "POST" else MessageSerializer

    def get_serializer_context(self):
        # Pass request context to serializer for get_content method
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_room(self):
        try:
            room = ChatRoom.objects.get(id=self.kwargs["room_id"])
        except ChatRoom.DoesNotExist:
            raise NotFound("Room not found")
        if self.request.user not in (room.user1, room.user2):
            raise PermissionDenied("You don't belong to this room")
        return room

    def get_queryset(self):
        room = self.get_room()
        return Message.objects.filter(room=room).order_by("timestamp")

    def perform_create(self, serializer):
        room = self.get_room()
        serializer.save(user=self.request.user, room=room)