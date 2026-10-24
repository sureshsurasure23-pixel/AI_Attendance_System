from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from attendance.models import Attendance
from faculty.models import Faculty
from students.models import Student
from subjects.models import Subject
from sessions_app.models import AttendanceSession
from notifications.models import Notification


class FacultyAttendance(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        # Get faculty
        faculty = Faculty.objects.get(
            id=request.data["faculty"]
        )

        # Get subject
        subject = Subject.objects.get(
            id=request.data["subject"]
        )

        # Get student
        student = Student.objects.get(
            id=request.data["student"]
        )

        # Get the selected attendance session / period
        session = AttendanceSession.objects.get(
            id=request.data["session"]
        )

        # Save attendance for this particular session
        attendance, created = Attendance.objects.get_or_create(
            student=student,
            session=session,
            defaults={
                "subject": subject,
                "date": session.attendance_date,
                "status": request.data["status"]
            }
        )

        # If attendance already exists, update it
        if not created:

            attendance.status = request.data["status"]

            attendance.subject = subject

            attendance.date = session.attendance_date

            attendance.save()

        # Calculate overall attendance
        total_classes = Attendance.objects.filter(
            student=student
        ).count()

        present_classes = Attendance.objects.filter(
            student=student,
            status=Attendance.STATUS_PRESENT
        ).count()

        if total_classes > 0:

            attendance_percentage = (
                present_classes / total_classes
            ) * 100

        else:

            attendance_percentage = 0

        # Low attendance notification
        if attendance_percentage < 75:

            notification_exists = Notification.objects.filter(
                student=student,
                title="Low Attendance Alert",
                is_read=False
            ).exists()

            if not notification_exists:

                Notification.objects.create(
                    student=student,
                    title="Low Attendance Alert",
                    message=(
                        f"Attendance Alert: "
                        f"{student.name}'s current attendance "
                        f"is {attendance_percentage:.2f}%, "
                        f"which is below the required 75%. "
                        f"Please attend classes regularly "
                        f"to improve attendance."
                    )
                )

        return Response({

            "message": "Attendance Saved Successfully",

            "student": student.name,

            "subject": subject.name,

            "date": str(session.attendance_date),

            "period": session.period,

            "status": attendance.status,

            "attendance_percentage": round(
                attendance_percentage,
                2
            ),

            "attendance_alert":
                attendance_percentage < 75

        })