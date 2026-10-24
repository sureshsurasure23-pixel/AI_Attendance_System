from django.db.models import Avg, Sum
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from students.models import Student
from attendance.models import Attendance
from marks.models import Mark
from fees.models import Fee


class StudentDashboard(APIView):
    permission_classes = [AllowAny]

    def get(self, request, student_id):

        student = Student.objects.get(id=student_id)

        total = Attendance.objects.filter(
            student=student
        ).count()

        present = Attendance.objects.filter(
            student=student,
            status="Present"
        ).count()

        attendance = 0

        if total > 0:
            attendance = round((present / total) * 100, 2)

        marks = Mark.objects.filter(
            student=student
        ).aggregate(
            Avg("percentage")
        )["percentage__avg"] or 0

        pending = Fee.objects.filter(
            student=student
        ).aggregate(
            Sum("balance_fee")
        )["balance_fee__sum"] or 0

        return Response({

            "student": student.name,
            "usn": student.usn,
            "department": student.department.name,
            "semester": student.semester,

            "attendance": attendance,

            "total_marks": round(marks, 2),

            "pending_fee": pending

        })