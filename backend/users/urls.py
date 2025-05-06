from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView,LoginView, AddFriendView, MutualFriendsView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path("friends/add/", AddFriendView.as_view(), name="add_friend"),
    path("friends/mutual/", MutualFriendsView.as_view(), name="mutual_friends"),
]