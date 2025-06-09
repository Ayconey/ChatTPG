from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import AnonymousUser
import json


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope["user"]
        if not user or user.is_anonymous:
            print("❌ Unauthorized access attempt to chat room")
            await self.close()
            return

        # use the room name directly from the URL
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"chat_{self.room_name}"

        print("🔒 Connected to encrypted room:", self.room_group_name)

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        print(f"🔐 Received encrypted message: {text_data[:50]}...")
        data = json.loads(text_data)

        # Extract encrypted content and IV
        content_for_sender = data.get("content_for_sender")
        content_for_receiver = data.get("content_for_receiver")
        iv = data.get("iv")
        username = data.get("username", self.scope["user"].username)

        if not all([content_for_sender, content_for_receiver, iv]):
            print("❌ Missing encryption data")
            return

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'content_for_sender': content_for_sender,
                'content_for_receiver': content_for_receiver,
                'iv': iv,
                'username': username
            }
        )

    async def chat_message(self, event):
        print(f"📤 Sending encrypted message to WebSocket")
        await self.send(text_data=json.dumps({
            "content_for_sender": event["content_for_sender"],
            "content_for_receiver": event["content_for_receiver"],
            "iv": event["iv"],
            "username": event["username"],
        }))