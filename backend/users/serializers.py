from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile,FriendRequest


class UserSerializer(serializers.ModelSerializer):
    # Write-only fields for registration
    public_key = serializers.CharField(write_only=True, required=False)
    salt = serializers.CharField(write_only=True, required=False)

    # Read-only fields from profile
    profile_public_key = serializers.CharField(source='userprofile.public_key', read_only=True)
    profile_salt = serializers.CharField(source='userprofile.salt', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'public_key', 'salt',
                  'profile_public_key', 'profile_salt']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        public_key = validated_data.pop('public_key', None)
        salt = validated_data.pop('salt', None)

        user = User.objects.create_user(**validated_data)

        profile, created = UserProfile.objects.get_or_create(user=user)
        profile.salt = salt
        profile.public_key = public_key
        profile.save()
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
