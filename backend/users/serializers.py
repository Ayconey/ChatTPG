# backend/users/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, FriendRequest


class UserSerializer(serializers.ModelSerializer):
    public_key = serializers.CharField(write_only=True)
    salt = serializers.CharField(write_only=True)
    iv = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'public_key', 'salt', 'iv']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        print("🔐 UserSerializer.create called")
        print("📥 Validated data keys:", list(validated_data.keys()))

        public_key = validated_data.pop('public_key', None)
        salt = validated_data.pop('salt', None)
        iv = validated_data.pop('iv', None)

        print("🔑 Crypto data extracted:", {
            'has_public_key': bool(public_key),
            'has_salt': bool(salt),
            'has_iv': bool(iv),
            'public_key_length': len(public_key) if public_key else 0
        })

        user = User.objects.create_user(**validated_data)
        print(f"👤 User created: {user.username}")

        # Prevent duplicate profile creation
        profile, created = UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'public_key': public_key,
                'salt': salt,
                'iv': iv
            }
        )

        if not created:
            # Update existing profile
            profile.public_key = public_key
            profile.salt = salt
            profile.iv = iv
            profile.save()
            print("🔄 Updated existing profile")
        else:
            print("✅ Created new profile")

        print(f"💾 Profile saved with crypto data: {bool(profile.public_key)}")
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