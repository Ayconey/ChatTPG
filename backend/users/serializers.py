from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, FriendRequest
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.contrib.auth.tokens import default_token_generator
from django.conf import settings

class UserSerializer(serializers.ModelSerializer):
    public_key = serializers.CharField(write_only=True)
    encrypted_private_key = serializers.CharField(write_only=True)
    salt = serializers.CharField(write_only=True)
    iv = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password',
            'public_key', 'encrypted_private_key', 'salt', 'iv'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'write_only': True}
        }

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value

    def create(self, validated_data):
        public_key = validated_data.pop('public_key')
        encrypted_private_key = validated_data.pop('encrypted_private_key')
        salt = validated_data.pop('salt')
        iv = validated_data.pop('iv')

        email = validated_data.get('email')

        user = User.objects.create_user(**validated_data)
        user.email = email
        user.is_active = False
        user.save()

        UserProfile.objects.update_or_create(
            user=user,
            defaults={
                'public_key': public_key,
                'encrypted_private_key': encrypted_private_key,
                'salt': salt,
                'iv': iv,
            }
        )

        # Email confirmation
        token = default_token_generator.make_token(user)
        uid = user.pk
        confirm_url = f"{settings.FRONTEND_URL}/verify-email/?uid={uid}&token={token}"

        send_mail(
            subject='Verify your email',
            message=f"Click the link to verify your account: {confirm_url}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )

        return user

class FriendRequestSerializer(serializers.ModelSerializer):
    from_user_username = serializers.CharField(source='from_user.username', read_only=True)
    to_user = serializers.CharField(write_only=True)  # Accept username instead of user ID

    class Meta:
        model = FriendRequest
        fields = ['id', 'from_user', 'from_user_username', 'to_user', 'timestamp', 'accepted']
        read_only_fields = ['from_user', 'timestamp', 'accepted']

    def validate_to_user(self, value):
        try:
            user = User.objects.get(username=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("User does not exist.")
        return user

    def create(self, validated_data):
        to_user = validated_data.pop('to_user')
        from_user = self.context['request'].user
        return FriendRequest.objects.create(from_user=from_user, to_user=to_user)