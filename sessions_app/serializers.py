from rest_framework import serializers
from .models import AttendanceSession


class AttendanceSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceSession
        fields = [
            "id",
            "faculty",
            "subject",
            "semester",
            "section",
            "attendance_date",
            "period",
            "start_time",
            "is_open",
        ]
        read_only_fields = ["id", "start_time"]

    def validate_period(self, value):
        if value < 1 or value > 8:
            raise serializers.ValidationError(
                "Period must be between 1 and 8."
            )
        return value