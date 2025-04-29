import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import path,re_path
from chat.consumers import ChatConsumer
from channels.security.websocket import AllowedHostsOriginValidator
import config.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
ASGI_APPLICATION = 'config.asgi.application'

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(
                config.routing.websocket_urlpatterns
            )
        )
    ),
})