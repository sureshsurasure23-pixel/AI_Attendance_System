from rest_framework import serializers
from .models import Faculty


class FacultySerializer(serializers.ModelSerializer):

    department_name = serializers.CharField(
        source="department.name",
        read_only=True
    )

    class Meta:
        model = Faculty

        fields = [
            "id",
            "user",
            "faculty_id",
            "name",
            "email",
            "phone",
            "designation",
            "department",
            "department_name",
        ]
