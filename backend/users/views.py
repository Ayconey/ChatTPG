from rest_framework import generics
from django.contrib.auth.models import User
from .serializers import UserSerializer
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from chat.models import ChatRoom

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]

class AddFriendView(APIView):
    def post(self, request):
        username_to_add = request.data.get('username')
        try:
            user_to_add = User.objects.get(username=username_to_add)
            requester_profile = request.user.userprofile
            friend_profile = user_to_add.userprofile

            if friend_profile == requester_profile:
                return Response({'detail': 'Nie możesz dodać siebie.'}, status=status.HTTP_400_BAD_REQUEST)

            # Dodaj znajomego
            requester_profile.friends.add(friend_profile)

            # Sprawdź, czy relacja jest odwzajemniona
            if requester_profile in friend_profile.friends.all():
                # Czy ChatRoom już istnieje?
                chat_exists = ChatRoom.objects.filter(
                    user1=request.user, user2=user_to_add
                ).exists() or ChatRoom.objects.filter(
                    user1=user_to_add, user2=request.user
                ).exists()

                if not chat_exists:
                    ChatRoom.objects.create(user1=request.user, user2=user_to_add)

            return Response({'detail': f'Dodano {username_to_add} do znajomych.'}, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({'detail': 'Użytkownik nie istnieje.'}, status=status.HTTP_404_NOT_FOUND)

class MutualFriendsView(APIView):
    def get(self, request):
        user_profile = request.user.userprofile
        my_friends = user_profile.friends.all()

        mutual_friends = []
        for friend_profile in my_friends:
            # Sprawdzenie czy relacja jest odwzajemniona
            if user_profile in friend_profile.friends.all():
                # Pobierz użytkownika znajomego
                friend_user = friend_profile.user

                # Znajdź istniejący ChatRoom
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