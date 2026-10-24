from rest_framework import serializers
from allocations.models import FacultySubject


class FacultySubjectSerializer(serializers.ModelSerializer):
    faculty_name = serializers.CharField(source="faculty.name", read_only=True)
    subject_name = serializers.CharField(source="subject.subject_name", read_only=True)
    department_name = serializers.CharField(source="department.name", read_only=True)
    semester = serializers.IntegerField(source="semester.semester_number", read_only=True)
    section = serializers.CharField(source="section.name", read_only=True)

    class Meta:
        model = FacultySubject
        fields = "__all__"