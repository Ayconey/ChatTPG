from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile,FriendRequest

class UserSerializer(serializers.ModelSerializer):
    public_key = serializers.CharField(write_only=True)
    encrypted_private_key = serializers.CharField(write_only=True)
    salt = serializers.CharField(write_only=True)
    iv = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'public_key', 'encrypted_private_key', 'salt', 'iv']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        public_key = validated_data.pop('public_key')
        encrypted_private_key = validated_data.pop('encrypted_private_key')
        salt = validated_data.pop('salt')
        iv = validated_data.pop('iv')

        user = User.objects.create_user(**validated_data)

        # Prevent duplicate profile creation
        if not UserProfile.objects.filter(user=user).exists():
            UserProfile.objects.create(
                user=user,
                public_key=public_key,
                encrypted_private_key=encrypted_private_key,
                salt=salt,
                iv=iv
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
