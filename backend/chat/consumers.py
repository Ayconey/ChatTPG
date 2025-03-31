import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Message, ChatRoom
from django.contrib.auth.models import User
from channels.db import database_sync_to_async


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)  # Odbieramy dane
        message = data['message']  # Wiadomość
        username = data['username']  # Nazwa użytkownika

        # Pobieramy użytkownika (przykład zakłada, że 'username' jest unikalne)
        # user = await database_sync_to_async(User.objects.get)(username=username)

        # Pobieramy pokój, do którego ta wiadomość należy
        room = await database_sync_to_async(ChatRoom.objects.get)(name=self.room_name)

        # Tworzymy obiekt Message i zapisujemy go w bazie danych
        #message_instance = Message(user=user, room=room, content=message)
        #await database_sync_to_async(message_instance.save)()

        # Rozsyłamy wiadomość do wszystkich połączonych w tym pokoju
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'username': username
            }
        )

    async def chat_message(self, event):
        message = event['message']
        username = event['username']

        await self.send(text_data=json.dumps({
            'message': message,
            'username': username
        }))