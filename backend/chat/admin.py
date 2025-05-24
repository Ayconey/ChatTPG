from django.contrib import admin
from .models import ChatRoom, Message


@admin.register(ChatRoom)
class ChatRoomAdmin(admin.ModelAdmin):
    list_display = ['id', 'user1', 'user2', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user1__username', 'user2__username']
    readonly_fields = ['created_at']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'room', 'timestamp', 'has_encrypted_content']
    list_filter = ['timestamp', 'room']
    search_fields = ['user__username']
    readonly_fields = ['timestamp']

    def has_encrypted_content(self, obj):
        return bool(obj.encrypted_content_for_sender and obj.encrypted_content_for_receiver)

    has_encrypted_content.boolean = True
    has_encrypted_content.short_description = 'Has Encrypted Content'