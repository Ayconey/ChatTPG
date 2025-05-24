# backend/users/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LogoutView, MeView, AddFriendView, MutualFriendsView,
    UserCryptoKeysView, UserPublicKeyView, FriendRequestListView,
    SendFriendRequestView, AcceptFriendRequestView, CookieTokenObtainPairView,UpdatePublicKeyView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path("login/", CookieTokenObtainPairView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", MeView.as_view(), name="me"),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Crypto endpoints
    path('crypto/keys/', UserCryptoKeysView.as_view(), name='get_user_crypto_keys'),
    path('crypto/public-key/<str:username>/', UserPublicKeyView.as_view(), name='get_public_key'),
    path('crypto/update-public-key/', UpdatePublicKeyView.as_view(), name='update_public_key'),

    # Friends
    path("friends/add/", AddFriendView.as_view(), name="add_friend"),
    path("friends/mutual/", MutualFriendsView.as_view(), name="mutual_friends"),
    path('friend-requests/', FriendRequestListView.as_view(), name='friend-requests'),
    path('friend-requests/send/', SendFriendRequestView.as_view(), name='send-friend-request'),
    path('friend-requests/<int:pk>/accept/', AcceptFriendRequestView.as_view(), name='accept-friend-request'),
]