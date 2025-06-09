import os
import django 

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from config.routing import websocket_urlpatterns
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from users.middleware import JWTAuthMiddleware  # <- custom JWT cookie auth middleware

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AllowedHostsOriginValidator(
        JWTAuthMiddleware(  # <- replaces AuthMiddlewareStack
            URLRouter(websocket_urlpatterns)
        )
    ),
})
