from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from .models import ChatRoom, Message
from users.models import UserProfile


class ChatRoomCreationTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.rooms_url = '/chat/rooms/'

        # Create two users - profiles will be created automatically via signal
        self.user1 = User.objects.create_user(username='alice', password='pass1')
        self.user2 = User.objects.create_user(username='bob', password='pass2')

        # Authenticate as user1
        self.client.force_authenticate(user=self.user1)

    def test_create_chat_room(self):
        """Test tworzenia pokoju czatu między użytkownikami"""
        data = {'username': 'bob'}

        response = self.client.post(self.rooms_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify room was created
        room = ChatRoom.objects.get(
            user1__in=[self.user1, self.user2],
            user2__in=[self.user1, self.user2]
        )

        # Users should be in correct order (by id)
        self.assertEqual(room.user1, self.user1)  # alice has lower id
        self.assertEqual(room.user2, self.user2)  # bob has higher id

        # Test duplicate room creation returns same room
        response2 = self.client.post(self.rooms_url, data, format='json')
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ChatRoom.objects.count(), 1)


class MessageSendingTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create users and room
        self.user1 = User.objects.create_user(username='alice', password='pass1')
        self.user2 = User.objects.create_user(username='bob', password='pass2')

        self.room = ChatRoom.objects.create(user1=self.user1, user2=self.user2)
        self.messages_url = f'/chat/messages/{self.room.id}/'

        # Authenticate as user1
        self.client.force_authenticate(user=self.user1)

    def test_send_encrypted_message(self):
        """Test wysyłania zaszyfrowanej wiadomości"""
        data = {
            'content_for_sender': 'encrypted_content_for_alice_base64',
            'content_for_receiver': 'encrypted_content_for_bob_base64',
            'iv': 'initialization_vector_base64'
        }

        response = self.client.post(self.messages_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verify message was saved
        message = Message.objects.get(room=self.room)
        self.assertEqual(message.user, self.user1)
        self.assertEqual(message.content_for_sender, data['content_for_sender'])
        self.assertEqual(message.content_for_receiver, data['content_for_receiver'])
        self.assertEqual(message.iv, data['iv'])


class MessageListTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create users and room
        self.user1 = User.objects.create_user(username='alice', password='pass1')
        self.user2 = User.objects.create_user(username='bob', password='pass2')

        self.room = ChatRoom.objects.create(user1=self.user1, user2=self.user2)

        # Create test messages
        Message.objects.create(
            user=self.user1,
            room=self.room,
            content_for_sender='encrypted_msg1_alice',
            content_for_receiver='encrypted_msg1_bob',
            iv='iv1'
        )

        Message.objects.create(
            user=self.user2,
            room=self.room,
            content_for_sender='encrypted_msg2_bob',
            content_for_receiver='encrypted_msg2_alice',
            iv='iv2'
        )

        self.messages_url = f'/chat/messages/{self.room.id}/'

    def test_get_messages_from_room(self):
        """Test pobierania wiadomości z pokoju"""
        # Authenticate as user1
        self.client.force_authenticate(user=self.user1)

        response = self.client.get(self.messages_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

        # Verify message order (oldest first)
        msg1 = response.data[0]
        msg2 = response.data[1]

        self.assertEqual(msg1['username'], 'alice')
        self.assertEqual(msg1['content_for_sender'], 'encrypted_msg1_alice')
        self.assertEqual(msg1['content_for_receiver'], 'encrypted_msg1_bob')

        self.assertEqual(msg2['username'], 'bob')
        self.assertEqual(msg2['content_for_sender'], 'encrypted_msg2_bob')
        self.assertEqual(msg2['content_for_receiver'], 'encrypted_msg2_alice')

        # Test unauthorized access
        self.client.force_authenticate(user=None)
        response = self.client.get(self.messages_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)