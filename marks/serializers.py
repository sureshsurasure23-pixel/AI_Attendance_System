from rest_framework import serializers
from marks.models import Mark


class MarkSerializer(serializers.ModelSerializer):

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

    faculty_name = serializers.CharField(
        source="faculty.name",
        read_only=True
    )

    class Meta:
        model = Mark
        fields = "__all__"