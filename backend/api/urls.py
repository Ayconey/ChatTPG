from django.urls import path, include
from . import views
from .views import MessageList

urlpatterns = [
    path('messages/',MessageList.as_view()),
]