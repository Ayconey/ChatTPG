from rest_framework import generics
from .models import ChatRoom, Message
from .serializers import ChatRoomSerializer, MessageSerializer
from django.contrib.auth.models import User
from rest_framework.exceptions import NotFound

class ChatRoomListView(generics.ListCreateAPIView):
    queryset = ChatRoom.objects.all()
    serializer_class = ChatRoomSerializer


class MessageListView(generics.ListCreateAPIView):

    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    def get_queryset(self):
        room_id = self.kwargs['room_id']
        return Message.objects.filter(room_id=room_id)