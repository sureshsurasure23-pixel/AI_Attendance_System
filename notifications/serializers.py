from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):

    student_name = serializers.CharField(
        source="student.name",
        read_only=True
    )

    usn = serializers.CharField(
        source="student.usn",
        read_only=True
    )

    parent_name = serializers.CharField(
        source="parent.parent_name",
        read_only=True
    )

    class Meta:
        model = Notification

        fields = [
            "id",
            "student",
            "student_name",
            "usn",
            "parent",
            "parent_name",
            "title",
            "message",
            "is_read",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "student_name",
            "usn",
            "parent_name",
        ]