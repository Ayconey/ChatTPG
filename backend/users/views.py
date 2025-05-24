# backend/users/views.py
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django.utils.timezone import now
from datetime import timedelta

from .models import UserProfile, FriendRequest
from .serializers import UserSerializer, FriendRequestSerializer
from .auth import CookieTokenAuthentication
from chat.models import ChatRoom


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        print("📥 RegisterView called with data:", request.data.keys())
        print("🔐 Has crypto fields:", {
            'public_key': bool(request.data.get('public_key')),
            'salt': bool(request.data.get('salt')),
            'iv': bool(request.data.get('iv'))
        })

        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("❌ Registration Error:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        print("✅ Registration successful")
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CookieTokenObtainPairView(TokenObtainPairView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        data = response.data

        access_token = data.get("access")
        refresh_token = data.get("refresh")

        access_exp = now() + timedelta(minutes=5)
        refresh_exp = now() + timedelta(days=7)

        response.set_cookie(
            key="accessToken",
            value=access_token,
            expires=access_exp,
            httponly=True,
            samesite="Lax",
            secure=False,
        )
        response.set_cookie(
            key="refreshToken",
            value=refresh_token,
            expires=refresh_exp,
            httponly=True,
            samesite="Lax",
            secure=False,
        )

        response.data = {"message": "Login successful"}
        return response


class MeView(APIView):
    authentication_classes = [CookieTokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class LogoutView(APIView):
    authentication_classes = [CookieTokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        response = Response({"message": "Logged out"}, status=200)
        response.delete_cookie("accessToken")
        response.delete_cookie("refreshToken")
        return response


# NOWY - endpoint do pobierania kluczy crypto dla użytkownika (salt, iv, public_key)
class UserCryptoKeysView(APIView):
    authentication_classes = [CookieTokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Zwraca salt i IV dla aktualnego użytkownika (do regeneracji kluczy)"""
        profile, created = UserProfile.objects.get_or_create(user=request.user)

        # Jeśli profile nie ma kluczy crypto, wygeneruj je
        if not profile.salt or not profile.iv:
            import secrets
            import base64

            profile.salt = base64.b64encode(secrets.token_bytes(16)).decode()
            profile.iv = base64.b64encode(secrets.token_bytes(12)).decode()
            profile.save()
            print(f"🔐 Generated crypto fields for user: {request.user.username}")

        return Response({
            "salt": profile.salt,
            "iv": profile.iv,
            "public_key": profile.public_key
        })


# NOWY - endpoint do pobierania klucza publicznego konkretnego użytkownika
class UserPublicKeyView(APIView):
    authentication_classes = [CookieTokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, username):
        """Zwraca klucz publiczny konkretnego użytkownika"""
        print(f"📥 UserPublicKeyView called for username: {username}")
        print(f"🔐 Authenticated user: {request.user}")

        try:
            user = User.objects.get(username=username)
            print(f"✅ Found user: {user}")
        except User.DoesNotExist:
            print(f"❌ User not found: {username}")
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            profile = UserProfile.objects.get(user=user)
            print(f"✅ Found profile: {profile}")
            print(f"🔑 Has public key: {bool(profile.public_key)}")
            if profile.public_key:
                print(f"🔑 Public key preview: {profile.public_key[:50]}...")
        except UserProfile.DoesNotExist:
            print(f"❌ UserProfile not found for user: {username}")
            return Response({'detail': 'User profile not found.'}, status=status.HTTP_404_NOT_FOUND)

        response_data = {
            "username": username,
            "public_key": profile.public_key
        }
        print(f"📤 Returning response: {response_data}")
        return Response(response_data)


class UpdatePublicKeyView(APIView):
    authentication_classes = [CookieTokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Aktualizuje klucz publiczny użytkownika"""
        public_key = request.data.get('public_key')

        if not public_key:
            return Response({'detail': 'Public key required.'}, status=status.HTTP_400_BAD_REQUEST)

        profile, created = UserProfile.objects.get_or_create(user=request.user)
        profile.public_key = public_key
        profile.save()

        print(f"🔐 Updated public key for user: {request.user.username}")
        return Response({'detail': 'Public key updated successfully.'})


class AddFriendView(APIView):
    authentication_classes = [CookieTokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        username_to_add = request.data.get('username')
        try:
            user_to_add = User.objects.get(username=username_to_add)
        except User.DoesNotExist:
            return Response({'detail': 'Użytkownik nie istnieje.'}, status=status.HTTP_404_NOT_FOUND)

        requester_profile, _ = UserProfile.objects.get_or_create(user=request.user)
        friend_profile, _ = UserProfile.objects.get_or_create(user=user_to_add)

        if requester_profile == friend_profile:
            return Response({'detail': 'Nie możesz dodać siebie.'}, status=status.HTTP_400_BAD_REQUEST)

        requester_profile.friends.add(friend_profile)

        if requester_profile in friend_profile.friends.all():
            chat_exists = ChatRoom.objects.filter(
                user1=request.user, user2=user_to_add
            ).exists() or ChatRoom.objects.filter(
                user1=user_to_add, user2=request.user
            ).exists()

            if not chat_exists:
                ChatRoom.objects.create(user1=request.user, user2=user_to_add)

        return Response({'detail': f'Dodano {username_to_add} do znajomych.'}, status=status.HTTP_200_OK)


class MutualFriendsView(APIView):
    authentication_classes = [CookieTokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_profile, _ = UserProfile.objects.get_or_create(user=request.user)
        mutual_friends = []

        for friend_profile in user_profile.friends.all():
            friend_user = friend_profile.user
            if user_profile in friend_profile.friends.all():
                room = ChatRoom.objects.filter(
                    user1=request.user, user2=friend_user
                ).first() or ChatRoom.objects.filter(
                    user1=friend_user, user2=request.user
                ).first()

                mutual_friends.append({
                    'username': friend_user.username,
                    'room_id': room.id if room else None
                })

        return Response({'mutual_friends': mutual_friends})


class FriendRequestListView(generics.ListAPIView):
    authentication_classes = [CookieTokenAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = FriendRequestSerializer

    def get_queryset(self):
        return FriendRequest.objects.filter(to_user=self.request.user, accepted=False)


class SendFriendRequestView(generics.CreateAPIView):
    authentication_classes = [CookieTokenAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = FriendRequestSerializer

    def get_serializer_context(self):
        return {"request": self.request}


class AcceptFriendRequestView(APIView):
    authentication_classes = [CookieTokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        print("📥 AcceptFriendRequestView called")
        print("🔐 Authenticated user:", request.user)

        try:
            f_request = FriendRequest.objects.get(id=pk, to_user=request.user)
            print(f"✅ Found friend request ID {pk} for user: {request.user.username}")
        except FriendRequest.DoesNotExist:
            print(f"❌ FriendRequest with ID {pk} not found or not for user {request.user.username}")
            return Response({'detail': 'Friend request not found.'}, status=404)

        if f_request.accepted:
            print(f"⚠️ Friend request {pk} already accepted")
            return Response({'detail': 'Already accepted'}, status=400)

        f_request.accepted = True
        f_request.save()
        print(f"✅ Friend request {pk} marked as accepted")

        from_profile = UserProfile.objects.get(user=f_request.from_user)
        to_profile = UserProfile.objects.get(user=f_request.to_user)
        print("👥 Profiles loaded:", from_profile.user.username, to_profile.user.username)

        from_profile.friends.add(to_profile)
        to_profile.friends.add(from_profile)
        print(f"🔗 Mutual friendship added between {from_profile.user.username} and {to_profile.user.username}")

        exists = ChatRoom.objects.filter(
            user1=f_request.from_user, user2=f_request.to_user
        ).exists() or ChatRoom.objects.filter(
            user1=f_request.to_user, user2=f_request.from_user
        ).exists()

        if not exists:
            ChatRoom.objects.create(user1=f_request.from_user, user2=f_request.to_user)
            print("💬 ChatRoom created")
        else:
            print("💬 ChatRoom already exists")

        return Response({'detail': 'Friend request accepted.'})