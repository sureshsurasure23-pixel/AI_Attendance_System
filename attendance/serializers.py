from rest_framework import serializers
from .models import Attendance


class AttendanceSerializer(serializers.ModelSerializer):

    student_name = serializers.CharField(
        source="student.name",
        read_only=True
    )

    usn = serializers.CharField(
        source="student.usn",
        read_only=True
    )

    subject_name = serializers.CharField(
        source="subject.name",
        read_only=True
    )

    period = serializers.IntegerField(
        source="session.period",
        read_only=True
    )

    session_date = serializers.DateField(
        source="session.attendance_date",
        read_only=True
    )

    class Meta:

        model = Attendance

        fields = [
            "id",

            "student",
            "student_name",
            "usn",

            "subject",
            "subject_name",

            "session",
            "period",
            "session_date",

            "date",

            "status",

            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "period",
            "session_date",
        ]