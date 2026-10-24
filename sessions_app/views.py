from datetime import date

from django.shortcuts import get_object_or_404

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import AttendanceSession
from .serializers import AttendanceSessionSerializer

from subjects.models import Subject
from faculty.models import Faculty
from allocations.models import FacultySubject


# =========================================================
# CREATE ATTENDANCE SESSION
# =========================================================

class AttendanceSessionCreate(generics.CreateAPIView):

    queryset = AttendanceSession.objects.all()
    serializer_class = AttendanceSessionSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):

        # -------------------------------------------------
        # 1. FACULTY ROLE
        # -------------------------------------------------

        if getattr(
            request.user,
            "role",
            None
        ) != "FACULTY":

            return Response(
                {
                    "detail":
                        "Faculty access required."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # -------------------------------------------------
        # 2. FACULTY PROFILE
        # -------------------------------------------------

        faculty = (
            Faculty.objects
            .filter(
                user=request.user
            )
            .first()
        )

        if not faculty:

            return Response(
                {
                    "detail":
                        "Faculty profile is not linked "
                        "to this account."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # -------------------------------------------------
        # 3. REQUEST DATA
        # -------------------------------------------------

        subject_id = request.data.get(
            "subject"
        )

        assignment_id = request.data.get(
            "assignment"
        )

        attendance_date_value = request.data.get(
            "attendance_date"
        )

        period = request.data.get(
            "period"
        )

        # -------------------------------------------------
        # 4. REQUIRED FIELDS
        # -------------------------------------------------

        if not subject_id:

            return Response(
                {
                    "detail":
                        "Subject is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not assignment_id:

            return Response(
                {
                    "detail":
                        "Faculty assignment is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not attendance_date_value:

            return Response(
                {
                    "detail":
                        "Attendance date is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if period is None:

            return Response(
                {
                    "detail":
                        "Period is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # 5. DATE VALIDATION
        # -------------------------------------------------

        try:

            attendance_date = date.fromisoformat(
                str(attendance_date_value)
            )

        except ValueError:

            return Response(
                {
                    "detail":
                        "Invalid attendance date. "
                        "Use YYYY-MM-DD format."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        today = date.today()

        if attendance_date > today:

            return Response(
                {
                    "detail":
                        "Attendance cannot be created "
                        "for a future date."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # 6. SUNDAY VALIDATION
        # -------------------------------------------------

        if attendance_date.weekday() == 6:

            return Response(
                {
                    "detail":
                        "Attendance cannot be marked "
                        "on Sunday."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # 7. PERIOD VALIDATION
        # -------------------------------------------------

        try:

            period = int(period)

        except (
            TypeError,
            ValueError
        ):

            return Response(
                {
                    "detail":
                        "Period must be a number "
                        "between 1 and 8."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if period < 1 or period > 8:

            return Response(
                {
                    "detail":
                        "Period must be between 1 and 8."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # 8. SUBJECT
        # -------------------------------------------------

        subject = get_object_or_404(
            Subject,
            id=subject_id
        )

        # -------------------------------------------------
        # 9. FACULTY ASSIGNMENT
        # -------------------------------------------------

        assignment = (
            FacultySubject.objects
            .filter(
                id=assignment_id,
                faculty=faculty,
                subject=subject
            )
            .select_related(
                "department",
                "semester",
                "section",
                "subject"
            )
            .first()
        )

        if not assignment:

            return Response(
                {
                    "detail":
                        "Invalid faculty assignment. "
                        "You are not assigned to this "
                        "subject."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # -------------------------------------------------
        # 10. CREATE SESSION DATA
        # -------------------------------------------------

        data = {
            "faculty":
                faculty.id,

            "subject":
                subject.id,

            "semester":
                assignment.semester.id,

            "section":
                assignment.section.id,

            "attendance_date":
                attendance_date,

            "period":
                period,

            "is_open":
                True
        }

        # -------------------------------------------------
        # 11. DUPLICATE SESSION CHECK
        # -------------------------------------------------

        existing_session = (
            AttendanceSession.objects
            .filter(
                faculty=faculty,
                subject=subject,
                semester=assignment.semester,
                section=assignment.section,
                attendance_date=attendance_date,
                period=period
            )
            .first()
        )

        if existing_session:

            return Response(
                {
                    "detail":
                        "An attendance session already "
                        "exists for this subject, "
                        "semester, section, date and period.",

                    "session":
                        AttendanceSessionSerializer(
                            existing_session
                        ).data
                },
                status=status.HTTP_200_OK
            )

        # -------------------------------------------------
        # 12. SERIALIZER
        # -------------------------------------------------

        serializer = self.get_serializer(
            data=data
        )

        serializer.is_valid(
            raise_exception=True
        )

        self.perform_create(
            serializer
        )

        # -------------------------------------------------
        # 13. RESPONSE
        # -------------------------------------------------

        return Response(
            {
                "success":
                    True,

                "message":
                    "Attendance session created successfully.",

                "assignment": {
                    "id":
                        assignment.id,

                    "semester":
                        assignment
                        .semester
                        .semester_number,

                    "section":
                        assignment
                        .section
                        .name,

                    "academic_year":
                        assignment
                        .academic_year
                },

                "session":
                    serializer.data
            },

            status=status.HTTP_201_CREATED
        )


# =========================================================
# LIST ATTENDANCE SESSIONS
# =========================================================

class AttendanceSessionList(generics.ListAPIView):

    queryset = AttendanceSession.objects.all()
    serializer_class = AttendanceSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        user = self.request.user

        # -------------------------------------------------
        # FACULTY
        # -------------------------------------------------

        if getattr(
            user,
            "role",
            None
        ) == "FACULTY":

            faculty = (
                Faculty.objects
                .filter(
                    user=user
                )
                .first()
            )

            if not faculty:
                return AttendanceSession.objects.none()

            return (
                AttendanceSession.objects
                .filter(
                    faculty=faculty
                )
                .select_related(
                    "faculty",
                    "subject",
                    "semester",
                    "section"
                )
                .order_by(
                    "-attendance_date",
                    "-period",
                    "-id"
                )
            )

        # -------------------------------------------------
        # ADMIN
        # -------------------------------------------------

        if getattr(
            user,
            "role",
            None
        ) == "ADMIN":

            return (
                AttendanceSession.objects
                .select_related(
                    "faculty",
                    "subject",
                    "semester",
                    "section"
                )
                .order_by(
                    "-attendance_date",
                    "-period",
                    "-id"
                )
            )

        # -------------------------------------------------
        # OTHER USERS
        # -------------------------------------------------

        return AttendanceSession.objects.none()