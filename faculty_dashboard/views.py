from django.db.models import Count
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from faculty.models import Faculty
from subjects.models import Subject
from attendance.models import Attendance


class FacultyDashboard(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, faculty_id):

        faculty = Faculty.objects.get(id=faculty_id)

        subject_count = Subject.objects.filter(
            faculty=faculty
        ).count()

        attendance_taken = Attendance.objects.filter(
            faculty=faculty
        ).count()

        total_students = Attendance.objects.filter(
            faculty=faculty
        ).values("student").distinct().count()

        return Response({
            "faculty_name": faculty.name,
            "department": faculty.department.name,
            "subjects": subject_count,
            "students": total_students,
            "attendance_taken": attendance_taken
        })