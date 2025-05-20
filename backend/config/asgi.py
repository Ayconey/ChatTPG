import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from config.routing import websocket_urlpatterns
from users.middleware import JWTAuthMiddleware  # <- custom JWT cookie auth middleware

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AllowedHostsOriginValidator(
        JWTAuthMiddleware(  # <- replaces AuthMiddlewareStack
            URLRouter(websocket_urlpatterns)
        )
    ),
})
