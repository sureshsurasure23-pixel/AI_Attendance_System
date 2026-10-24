from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from students.models import Student
from faculty.models import Faculty
from subjects.models import Subject
from attendance.models import Attendance
from fees.models import Fee
from marks.models import Mark


class AdminDashboard(APIView):

    permission_classes = [AllowAny]

    def get(self, request):

        students = Student.objects.count()
        faculty = Faculty.objects.count()
        subjects = Subject.objects.count()

        total = Attendance.objects.count()
        present = Attendance.objects.filter(status="Present").count()

        attendance_percentage = 0
        if total > 0:
            attendance_percentage = (present / total) * 100

        pending_fee_students = Fee.objects.filter(status="Pending").count()

        marks_records = Mark.objects.count()

        return Response({
            "students": students,
            "faculty": faculty,
            "subjects": subjects,
            "attendance_percentage": round(attendance_percentage, 2),
            "pending_fee_students": pending_fee_students,
            "marks_records": marks_records,
        })