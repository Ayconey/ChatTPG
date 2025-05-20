# auth.py
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed

class CookieTokenAuthentication(JWTAuthentication):
    def authenticate(self, request):
        access_token = request.COOKIES.get("accessToken")
        if not access_token:
            return None
        validated_token = self.get_validated_token(access_token)
        return self.get_user(validated_token), validated_token
