from django.urls import path
from .views import ChatRoomListView, MessageListView

urlpatterns = [
    path('rooms/', ChatRoomListView.as_view(), name='room-list'),
    path('messages/<int:room_id>/', MessageListView.as_view(), name='message-list'),
]