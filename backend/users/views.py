# users/views.py

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import UserProfile,FriendRequest
from .serializers import UserSerializer,FriendRequestSerializer
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from chat.models import ChatRoom
from rest_framework import generics, permissions

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]

class EncryptedPrivateKeyView(APIView):

    def get(self, request):
        profile = UserProfile.objects.get(user=request.user)
        return Response({
            "encrypted_private_key": profile.encrypted_private_key,
            "public_key": profile.public_key,
            "salt": profile.salt,
            "iv": profile.iv
        })

class AddFriendView(APIView):
    def post(self, request):
        username_to_add = request.data.get('username')
        try:
            user_to_add = User.objects.get(username=username_to_add)
        except User.DoesNotExist:
            return Response(
                {'detail': 'Użytkownik nie istnieje.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # ensure both profiles exist
        requester_profile, _ = UserProfile.objects.get_or_create(user=request.user)
        friend_profile, _    = UserProfile.objects.get_or_create(user=user_to_add)

        if requester_profile == friend_profile:
            return Response(
                {'detail': 'Nie możesz dodać siebie.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # add friend
        requester_profile.friends.add(friend_profile)

        # if mutual, create chat room if needed
        if requester_profile in friend_profile.friends.all():
            chat_exists = ChatRoom.objects.filter(
                user1=request.user, user2=user_to_add
            ).exists() or ChatRoom.objects.filter(
                user1=user_to_add, user2=request.user
            ).exists()

            if not chat_exists:
                ChatRoom.objects.create(user1=request.user, user2=user_to_add)

        return Response(
            {'detail': f'Dodano {username_to_add} do znajomych.'},
            status=status.HTTP_200_OK
        )

class MutualFriendsView(APIView):
    def get(self, request):
        # ensure the requesting user's profile exists
        user_profile, _ = UserProfile.objects.get_or_create(user=request.user)

        mutual_friends = []
        for friend_profile in user_profile.friends.all():
            # ensure friend's profile exists (probably yes)
            friend_user = friend_profile.user
            # check reciprocal
            if user_profile in friend_profile.friends.all():
                # find or create chat room
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
    serializer_class = FriendRequestSerializer

    def get_queryset(self):
        return FriendRequest.objects.filter(to_user=self.request.user, accepted=False)

class SendFriendRequestView(generics.CreateAPIView):
    serializer_class = FriendRequestSerializer

    def perform_create(self, serializer):
        serializer.save(from_user=self.request.user)
