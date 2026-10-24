from rest_framework import serializers
from .models import Subject


class SubjectSerializer(serializers.ModelSerializer):

    department_name = serializers.CharField(
        source="department.name",
        read_only=True
    )

    faculty_name = serializers.CharField(
        source="faculty.name",
        read_only=True
    )

    class Meta:
        model = Subject
        fields = [
            "id",
            "subject_id",
            "subject_code",
            "name",
            "credits",
            "semester",
            "department",
            "department_name",
            "faculty",
            "faculty_name",
        ]