from django.shortcuts import get_object_or_404
from django.db.models import Avg, Sum

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from accounts.models import User
from students.models import Student
from parent_dashboard.models import Parent
from attendance.models import Attendance
from marks.models import Mark
from fees.models import Fee
from notifications.models import Notification


class ParentDashboard(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):

        # ---------------------------------------------------------
        # 1. ADMIN ACCESS
        # ---------------------------------------------------------
        if request.user.role == "ADMIN":

            student = get_object_or_404(
                Student,
                id=student_id
            )

        # ---------------------------------------------------------
        # 2. PARENT ACCESS
        # ---------------------------------------------------------
        elif Parent.objects.filter(
            user=request.user
        ).exists():

            parent = (
                Parent.objects
                .select_related("student")
                .get(user=request.user)
            )

            student = parent.student

            # Parent can only see their own linked student
            if student.id != student_id:
                return Response(
                    {
                        "message":
                        "You are not authorized to view this student's dashboard."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # ---------------------------------------------------------
        # 3. NORMAL STUDENT ACCESS
        # ---------------------------------------------------------
        elif request.user.role == "STUDENT":

            student = Student.objects.filter(
                user=request.user
            ).first()

            if not student:
                return Response(
                    {
                        "message":
                        "Student profile not found."
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

            if student.id != student_id:
                return Response(
                    {
                        "message":
                        "You are not authorized to view this student's dashboard."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # ---------------------------------------------------------
        # 4. OTHER USERS
        # ---------------------------------------------------------
        else:

            return Response(
                {
                    "message":
                    "Parent dashboard access is not available for this account."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # ---------------------------------------------------------
        # ATTENDANCE
        # Monday-Saturday only
        # ---------------------------------------------------------

        attendance_records = (
            Attendance.objects
            .filter(student=student)
            .exclude(date__week_day=1)
        )

        total = attendance_records.count()

        present = attendance_records.filter(
            status=Attendance.STATUS_PRESENT
        ).count()

        absent = attendance_records.filter(
            status=Attendance.STATUS_ABSENT
        ).count()

        attendance_percentage = (
            (present / total) * 100
            if total
            else 0
        )

        if attendance_percentage >= 75:
            attendance_status = "SAFE"
        elif attendance_percentage >= 65:
            attendance_status = "WARNING"
        else:
            attendance_status = "CRITICAL"

        # ---------------------------------------------------------
        # ACADEMIC PERFORMANCE
        # ---------------------------------------------------------

        marks = Mark.objects.filter(
            student=student
        ).aggregate(
            Avg("percentage")
        )["percentage__avg"] or 0

        # ---------------------------------------------------------
        # FEES
        # ---------------------------------------------------------

        pending_fee = Fee.objects.filter(
            student=student
        ).aggregate(
            Sum("balance_fee")
        )["balance_fee__sum"] or 0

        # ---------------------------------------------------------
        # ACADEMIC PREDICTION
        # ---------------------------------------------------------

        prediction = "Excellent"

        if marks < 40:
            prediction = "Poor"
        elif marks < 60:
            prediction = "Average"
        elif marks < 80:
            prediction = "Good"

        # ---------------------------------------------------------
        # NOTIFICATIONS
        # ---------------------------------------------------------

        notifications = (
            Notification.objects
            .filter(student=student)
            .order_by("-created_at")[:10]
        )

        notification_data = []

        for notification in notifications:

            notification_data.append(
                {
                    "id": notification.id,
                    "title": notification.title,
                    "message": notification.message,
                    "is_read": notification.is_read,
                    "created_at": notification.created_at,
                }
            )

        # ---------------------------------------------------------
        # ATTENDANCE HISTORY
        # ---------------------------------------------------------

        records = (
            attendance_records
            .select_related(
                "subject",
                "session"
            )
            .order_by(
                "-date",
                "-id"
            )
        )

        attendance_data = []

        for record in records:

            attendance_data.append(
                {
                    "id": record.id,
                    "date": record.date,
                    "subject":
                        record.subject.name
                        if record.subject
                        else "Class",
                    "period":
                        record.session.period
                        if record.session
                        else None,
                    "status":
                        record.status,
                }
            )

        # ---------------------------------------------------------
        # RESPONSE
        # ---------------------------------------------------------

        return Response(
            {
                "student": {
                    "name": student.name,
                    "student_id":
                        student.student_id,
                    "usn":
                        student.usn,
                    "email":
                        student.email,
                    "phone":
                        student.phone,
                    "department":
                        student.department.name,
                    "semester":
                        student.semester,
                    "section":
                        student.section,
                },

                "attendance": {
                    "percentage":
                        round(
                            attendance_percentage,
                            2
                        ),
                    "present":
                        present,
                    "absent":
                        absent,
                    "total":
                        total,
                    "required":
                        75,
                    "status":
                        attendance_status,
                },

                "academic": {
                    "average_marks":
                        round(
                            marks,
                            2
                        ),
                    "prediction":
                        prediction,
                },

                "fees": {
                    "pending_fee":
                        float(
                            pending_fee
                        ),
                },

                "attendance_records":
                    attendance_data,

                "notifications":
                    notification_data,
            }
        )