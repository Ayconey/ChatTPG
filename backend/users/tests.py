from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from .models import UserProfile, FriendRequest
from chat.models import ChatRoom
import json


class UserRegistrationTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = '/user/register/'

    def test_user_registration_with_crypto_keys(self):
        """Test rejestracji użytkownika z kluczami kryptograficznymi"""
        data = {
            'username': 'testuser',
            'password': 'testpass123',
            'email': 'test@example.com',  # Added email field
            'public_key': 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA' + 'A' * 300,  # Mock RSA key
            'encrypted_private_key': 'encrypted_key_base64_string',
            'salt': 'test_salt_base64',
            'iv': 'test_iv_base64'
        }

        response = self.client.post(self.register_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username='testuser').exists())

        user = User.objects.get(username='testuser')
        profile = UserProfile.objects.get(user=user)

        self.assertEqual(profile.public_key, data['public_key'])
        self.assertEqual(profile.encrypted_private_key, data['encrypted_private_key'])
        self.assertEqual(profile.salt, data['salt'])
        self.assertEqual(profile.iv, data['iv'])


class UserLoginTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.login_url = '/user/login/'

        # Create test user - profile will be created automatically via signal
        self.user = User.objects.create_user(username='testuser', password='testpass123')

        # Update the automatically created profile with crypto data
        self.profile = self.user.userprofile
        self.profile.public_key = 'test_public_key'
        self.profile.encrypted_private_key = 'test_encrypted_key'
        self.profile.salt = 'test_salt'
        self.profile.iv = 'test_iv'
        self.profile.save()

    def test_login_sets_jwt_cookies(self):
        """Test logowania i ustawiania ciasteczek JWT"""
        data = {
            'username': 'testuser',
            'password': 'testpass123'
        }

        response = self.client.post(self.login_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'Login successful')

        # Check if cookies are set
        self.assertIn('accessToken', response.cookies)
        self.assertIn('refreshToken', response.cookies)

        # Verify cookie properties
        access_cookie = response.cookies['accessToken']
        self.assertTrue(access_cookie['httponly'])
        self.assertEqual(access_cookie['samesite'], 'Lax')


class FriendRequestTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create two users - profiles will be created automatically via signal
        self.user1 = User.objects.create_user(username='user1', password='pass1')
        self.user2 = User.objects.create_user(username='user2', password='pass2')

        # Create friend request
        self.friend_request = FriendRequest.objects.create(
            from_user=self.user1,
            to_user=self.user2
        )

        # Authenticate as user2
        self.client.force_authenticate(user=self.user2)

    def test_accept_friend_request(self):
        """Test akceptowania zaproszeń do znajomych"""
        url = f'/user/friend-requests/{self.friend_request.id}/accept/'

        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify friend request is accepted
        self.friend_request.refresh_from_db()
        self.assertTrue(self.friend_request.accepted)

        # Verify mutual friendship
        profile1 = UserProfile.objects.get(user=self.user1)
        profile2 = UserProfile.objects.get(user=self.user2)

        self.assertIn(profile2, profile1.friends.all())
        self.assertIn(profile1, profile2.friends.all())

        # Verify chat room was created
        self.assertTrue(
            ChatRoom.objects.filter(
                user1__in=[self.user1, self.user2],
                user2__in=[self.user1, self.user2]
            ).exists()
        )