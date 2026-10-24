from rest_framework import serializers
from students.models import Student


class StudentSerializer(serializers.ModelSerializer):

    department_name = serializers.CharField(
        source="department.name",
        read_only=True
    )

    class Meta:
        model = Student
        fields = [
            "id",
            "student_id",
            "usn",
            "name",
            "email",
            "phone",
            "address",
            "semester",
            "section",
            "department",
            "department_name",
            "created_at",
        ]