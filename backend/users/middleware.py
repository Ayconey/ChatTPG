# users/middleware.py
from channels.middleware import BaseMiddleware
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth.models import AnonymousUser, User
from django.db import close_old_connections
from asgiref.sync import sync_to_async

class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        headers = dict(scope.get("headers", []))
        raw_cookie = headers.get(b"cookie", b"").decode()

        access_token = None
        for part in raw_cookie.split(";"):
            if part.strip().startswith("accessToken="):
                access_token = part.strip().split("=")[-1]
                break

        user = AnonymousUser()
        if access_token:
            try:
                validated_token = AccessToken(access_token)
                user_id = validated_token.get("user_id")
                user = await sync_to_async(User.objects.get)(id=user_id)
            except Exception as e:
                print("❌ Token validation failed:", e)

        scope["user"] = user
        close_old_connections()
        return await super().__call__(scope, receive, send)
