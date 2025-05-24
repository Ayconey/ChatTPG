from django.contrib import admin
from .models import UserProfile, FriendRequest


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'name', 'surname', 'has_public_key', 'has_salt', 'has_iv']
    list_filter = ['user__date_joined']
    search_fields = ['user__username', 'name', 'surname']
    readonly_fields = ['user']

    def has_public_key(self, obj):
        return bool(obj.public_key)

    has_public_key.boolean = True
    has_public_key.short_description = 'Has Public Key'

    def has_salt(self, obj):
        return bool(obj.salt)

    has_salt.boolean = True
    has_salt.short_description = 'Has Salt'

    def has_iv(self, obj):
        return bool(obj.iv)

    has_iv.boolean = True
    has_iv.short_description = 'Has IV'


@admin.register(FriendRequest)
class FriendRequestAdmin(admin.ModelAdmin):
    list_display = ['from_user', 'to_user', 'timestamp', 'accepted']
    list_filter = ['accepted', 'timestamp']
    search_fields = ['from_user__username', 'to_user__username']
    readonly_fields = ['timestamp']