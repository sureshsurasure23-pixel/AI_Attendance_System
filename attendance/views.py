from datetime import date

from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db import transaction

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import Attendance
from .serializers import AttendanceSerializer

from students.models import Student
from subjects.models import Subject
from faculty.models import Faculty
from allocations.models import FacultySubject

from notifications.models import Notification
from parent_dashboard.models import Parent


# =========================================================
# ATTENDANCE DAY VALIDATION
# =========================================================

def validate_attendance_day(attendance_date):

    if not attendance_date:
        return "Attendance date is required."

    # Monday = 0
    # Tuesday = 1
    # Wednesday = 2
    # Thursday = 3
    # Friday = 4
    # Saturday = 5
    # Sunday = 6

    if attendance_date.weekday() == 6:
        return "Attendance cannot be marked on Sunday."

    return None


# =========================================================
# HELPER FUNCTIONS
# =========================================================

def get_attendance_percentage(present, total):

    if total == 0:
        return 0.0

    return round((present / total) * 100, 2)


def get_attendance_status(percentage):

    if percentage >= 75:
        return "SAFE"

    elif percentage >= 65:
        return "WARNING"

    return "CRITICAL"


# =========================================================
# AUTOMATIC ATTENDANCE NOTIFICATION
# =========================================================

def create_attendance_notification(student):

    today = timezone.localdate()

    attendance = (
        Attendance.objects
        .filter(
            student=student,
            date__lte=today
        )
        .exclude(
            date__week_day=1
        )
    )

    total_classes = attendance.count()

    present = (
        attendance
        .filter(
            status=Attendance.STATUS_PRESENT
        )
        .count()
    )

    if total_classes == 0:
        return

    percentage = get_attendance_percentage(
        present,
        total_classes
    )

    # -----------------------------------------------------
    # SAFE
    # -----------------------------------------------------

    if percentage >= 75:

        Notification.objects.filter(
            student=student,
            title__in=[
                "Attendance Warning",
                "Critical Attendance Alert"
            ],
            is_read=False
        ).update(
            is_read=True
        )

        return

    # -----------------------------------------------------
    # CLASSES NEEDED TO REACH 75%
    # -----------------------------------------------------

    classes_needed = 0

    while (
        (
            (present + classes_needed)
            /
            (total_classes + classes_needed)
        )
        * 100
        < 75
    ):
        classes_needed += 1

    # -----------------------------------------------------
    # MESSAGE
    # -----------------------------------------------------

    if percentage < 65:

        title = "Critical Attendance Alert"

        message = (
            f"Your attendance is currently "
            f"{percentage}%. "
            f"This is below the required "
            f"75% attendance. "
            f"You are at critical attendance risk. "
            f"You have attended "
            f"{present} out of "
            f"{total_classes} classes. "
            f"You need to attend the next "
            f"{classes_needed} classes continuously "
            f"to reach 75%."
        )

    else:

        title = "Attendance Warning"

        message = (
            f"Your attendance is currently "
            f"{percentage}%. "
            f"The required attendance is 75%. "
            f"You have attended "
            f"{present} out of "
            f"{total_classes} classes. "
            f"Please attend your upcoming classes "
            f"regularly. "
            f"You need to attend the next "
            f"{classes_needed} classes continuously "
            f"to reach 75%."
        )

    # -----------------------------------------------------
    # PARENT
    # -----------------------------------------------------

    parent = (
        Parent.objects
        .filter(
            student=student
        )
        .first()
    )

    # -----------------------------------------------------
    # EXISTING UNREAD ATTENDANCE ALERT
    # -----------------------------------------------------

    existing_notification = (
        Notification.objects
        .filter(
            student=student,
            title__in=[
                "Attendance Warning",
                "Critical Attendance Alert"
            ],
            is_read=False
        )
        .order_by(
            "-created_at"
        )
        .first()
    )

    if existing_notification:

        existing_notification.title = title
        existing_notification.message = message
        existing_notification.parent = parent

        existing_notification.save(
            update_fields=[
                "title",
                "message",
                "parent"
            ]
        )

        return

    # -----------------------------------------------------
    # CREATE
    # -----------------------------------------------------

    Notification.objects.create(
        student=student,
        parent=parent,
        title=title,
        message=message
    )


# =========================================================
# STUDENT AUTHORIZATION HELPER
# =========================================================

def get_logged_in_student(request):

    if getattr(
        request.user,
        "role",
        None
    ) != "STUDENT":

        return None

    return Student.objects.filter(
        user=request.user
    ).first()


# =========================================================
# FACULTY AUTHORIZATION HELPER
# =========================================================

def get_logged_in_faculty(request):

    if getattr(
        request.user,
        "role",
        None
    ) != "FACULTY":

        return None

    return Faculty.objects.filter(
        user=request.user
    ).first()


# =========================================================
# 1. ATTENDANCE LIST + CREATE
# =========================================================

class AttendanceListCreateView(APIView):

    permission_classes = [IsAuthenticated]

    # -----------------------------------------------------
    # GET /attendance/
    # -----------------------------------------------------

    def get(self, request):

        role = getattr(
            request.user,
            "role",
            None
        )

        today = timezone.localdate()

        # -------------------------------------------------
        # STUDENT
        # -------------------------------------------------

        if role == "STUDENT":

            student = get_logged_in_student(request)

            if not student:

                return Response(
                    {
                        "detail":
                            "Student profile is not linked "
                            "to this account."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            attendance = (
                Attendance.objects
                .select_related(
                    "student",
                    "subject",
                    "session"
                )
                .filter(
                    student=student,
                    date__lte=today
                )
                .exclude(
                    date__week_day=1
                )
                .order_by(
                    "-date",
                    "-id"
                )
            )

        # -------------------------------------------------
        # FACULTY
        # -------------------------------------------------

        elif role == "FACULTY":

            faculty = get_logged_in_faculty(request)

            if not faculty:

                return Response(
                    {
                        "detail":
                            "Faculty profile is not linked "
                            "to this account."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            assignment_subject_ids = (
                FacultySubject.objects
                .filter(
                    faculty=faculty
                )
                .values_list(
                    "subject_id",
                    flat=True
                )
                .distinct()
            )

            attendance = (
                Attendance.objects
                .select_related(
                    "student",
                    "subject",
                    "session"
                )
                .filter(
                    subject_id__in=assignment_subject_ids,
                    date__lte=today
                )
                .exclude(
                    date__week_day=1
                )
                .order_by(
                    "-date",
                    "-id"
                )
            )

        # -------------------------------------------------
        # ADMIN
        # -------------------------------------------------

        elif role == "ADMIN":

            attendance = (
                Attendance.objects
                .select_related(
                    "student",
                    "subject",
                    "session"
                )
                .filter(
                    date__lte=today
                )
                .exclude(
                    date__week_day=1
                )
                .order_by(
                    "-date",
                    "-id"
                )
            )

        else:

            return Response(
                {
                    "detail": "Access denied."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = AttendanceSerializer(
            attendance,
            many=True
        )

        return Response(
            serializer.data
        )

    # -----------------------------------------------------
    # POST /attendance/
    # -----------------------------------------------------

    def post(self, request):

        role = getattr(
            request.user,
            "role",
            None
        )

        if role not in [
            "FACULTY",
            "ADMIN"
        ]:

            return Response(
                {
                    "detail":
                        "Only Faculty or Admin users "
                        "can mark attendance."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        attendance_date_value = request.data.get(
            "date"
        )

        if not attendance_date_value:

            return Response(
                {
                    "detail":
                        "Attendance date is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

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

        today = timezone.localdate()

        if attendance_date > today:

            return Response(
                {
                    "detail":
                        "Attendance cannot be marked "
                        "for a future date."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        day_error = validate_attendance_day(
            attendance_date
        )

        if day_error:

            return Response(
                {
                    "detail": day_error
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # SESSION
        # -------------------------------------------------

        session_id = request.data.get(
            "session"
        )

        session = None

        if session_id:

            from sessions_app.models import AttendanceSession

            session = get_object_or_404(
                AttendanceSession,
                id=session_id
            )

            if session.attendance_date != attendance_date:

                return Response(
                    {
                        "detail":
                            "Attendance date does not "
                            "match the selected session date."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if session.attendance_date > today:

                return Response(
                    {
                        "detail":
                            "Attendance session cannot "
                            "be for a future date."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            session_error = validate_attendance_day(
                session.attendance_date
            )

            if session_error:

                return Response(
                    {
                        "detail": session_error
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if (
                session.period < 1
                or session.period > 8
            ):

                return Response(
                    {
                        "detail":
                            "Period must be between 1 and 8."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        # -------------------------------------------------
        # SERIALIZER
        # -------------------------------------------------

        serializer = AttendanceSerializer(
            data=request.data
        )

        if not serializer.is_valid():

            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        student = serializer.validated_data.get(
            "student"
        )

        if not student:

            return Response(
                {
                    "detail":
                        "Student is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # DUPLICATE
        # -------------------------------------------------

        if session:

            existing_attendance = (
                Attendance.objects
                .filter(
                    student=student,
                    session=session
                )
                .first()
            )

            if existing_attendance:

                return Response(
                    {
                        "detail":
                            "Attendance for this student "
                            "and period has already been marked."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        # -------------------------------------------------
        # ADMIN
        # -------------------------------------------------

        if role == "ADMIN":

            attendance = serializer.save()

            create_attendance_notification(
                attendance.student
            )

            return Response(
                {
                    "message":
                        "Attendance marked successfully",

                    "data":
                        AttendanceSerializer(
                            attendance
                        ).data
                },
                status=status.HTTP_201_CREATED
            )

        # -------------------------------------------------
        # FACULTY
        # -------------------------------------------------

        faculty = get_logged_in_faculty(request)

        if not faculty:

            return Response(
                {
                    "detail":
                        "Faculty profile is not linked "
                        "to this account."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        subject_id = request.data.get(
            "subject"
        )

        student_id = request.data.get(
            "student"
        )

        subject = get_object_or_404(
            Subject,
            id=subject_id
        )

        student = get_object_or_404(
            Student,
            id=student_id
        )

        # -------------------------------------------------
        # ASSIGNMENT
        # -------------------------------------------------

        assignment_id = request.data.get(
            "assignment"
        )

        if assignment_id:

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
                    "section"
                )
                .first()
            )

        else:

            assignment = (
                FacultySubject.objects
                .filter(
                    faculty=faculty,
                    subject=subject
                )
                .select_related(
                    "department",
                    "semester",
                    "section"
                )
                .first()
            )

        if not assignment:

            return Response(
                {
                    "detail":
                        "You are not assigned to "
                        "this subject."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # -------------------------------------------------
        # DEPARTMENT
        # -------------------------------------------------

        if (
            student.department_id
            != assignment.department_id
        ):

            return Response(
                {
                    "detail":
                        "You are not authorized to "
                        "mark attendance for this student."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # -------------------------------------------------
        # SEMESTER
        # -------------------------------------------------

        if (
            student.semester
            != assignment.semester.semester_number
        ):

            return Response(
                {
                    "detail":
                        "You are not authorized to "
                        "mark attendance for this student."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # -------------------------------------------------
        # SECTION
        # -------------------------------------------------

        if (
            student.section
            != assignment.section.name
        ):

            return Response(
                {
                    "detail":
                        "You are not authorized to "
                        "mark attendance for this student."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # -------------------------------------------------
        # SESSION CHECK
        # -------------------------------------------------

        if session:

            if session.faculty_id != faculty.id:

                return Response(
                    {
                        "detail":
                            "You are not authorized for "
                            "this attendance session."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            if session.subject_id != subject.id:

                return Response(
                    {
                        "detail":
                            "This attendance session does not "
                            "belong to the selected subject."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if session.semester_id != assignment.semester_id:

                return Response(
                    {
                        "detail":
                            "This attendance session does not "
                            "belong to the selected semester."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if session.section_id != assignment.section_id:

                return Response(
                    {
                        "detail":
                            "This attendance session does not "
                            "belong to the selected section."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        # -------------------------------------------------
        # SAVE
        # -------------------------------------------------

        attendance = serializer.save()

        create_attendance_notification(
            student
        )

        return Response(
            {
                "message":
                    "Attendance marked successfully",

                "data":
                    AttendanceSerializer(
                        attendance
                    ).data
            },
            status=status.HTTP_201_CREATED
        )


# =========================================================
# 2. STUDENT ATTENDANCE HISTORY
# =========================================================

class StudentAttendanceView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):

        role = getattr(
            request.user,
            "role",
            None
        )

        student = get_object_or_404(
            Student,
            id=student_id
        )

        if role == "STUDENT":

            logged_in_student = get_logged_in_student(
                request
            )

            if not logged_in_student:

                return Response(
                    {
                        "detail":
                            "Student profile is not linked "
                            "to this account."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            if logged_in_student.id != student.id:

                return Response(
                    {
                        "detail":
                            "You can only access "
                            "your own attendance."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        elif role not in [
            "FACULTY",
            "ADMIN"
        ]:

            return Response(
                {
                    "detail": "Access denied."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        today = timezone.localdate()

        attendance = (
            Attendance.objects
            .select_related(
                "student",
                "subject",
                "session"
            )
            .filter(
                student=student,
                date__lte=today
            )
            .exclude(
                date__week_day=1
            )
            .order_by(
                "-date",
                "-id"
            )
        )

        total_classes = attendance.count()

        present = attendance.filter(
            status=Attendance.STATUS_PRESENT
        ).count()

        absent = attendance.filter(
            status=Attendance.STATUS_ABSENT
        ).count()

        percentage = get_attendance_percentage(
            present,
            total_classes
        )

        serializer = AttendanceSerializer(
            attendance,
            many=True
        )

        return Response(
            {
                "student_id": student.student_id,
                "student_name": student.name,
                "total_classes": total_classes,
                "present": present,
                "absent": absent,
                "attendance_percentage": percentage,
                "status": get_attendance_status(percentage),
                "records": serializer.data
            }
        )


# =========================================================
# 3. STUDENT SUBJECT-WISE ATTENDANCE
# =========================================================

class StudentSubjectAttendanceView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):

        role = getattr(
            request.user,
            "role",
            None
        )

        student = get_object_or_404(
            Student,
            id=student_id
        )

        if role == "STUDENT":

            logged_in_student = get_logged_in_student(
                request
            )

            if not logged_in_student:

                return Response(
                    {
                        "detail":
                            "Student profile is not linked "
                            "to this account."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            if logged_in_student.id != student.id:

                return Response(
                    {
                        "detail":
                            "You can only access "
                            "your own attendance."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        elif role not in [
            "FACULTY",
            "ADMIN"
        ]:

            return Response(
                {
                    "detail": "Access denied."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        today = timezone.localdate()

        attendance = (
            Attendance.objects
            .select_related("subject")
            .filter(
                student=student,
                date__lte=today
            )
            .exclude(
                date__week_day=1
            )
        )

        subject_ids = (
            attendance
            .values_list(
                "subject_id",
                flat=True
            )
            .distinct()
        )

        subject_data = []

        for subject_id in subject_ids:

            subject = Subject.objects.filter(
                id=subject_id
            ).first()

            subject_attendance = attendance.filter(
                subject_id=subject_id
            )

            total_classes = subject_attendance.count()

            present = subject_attendance.filter(
                status=Attendance.STATUS_PRESENT
            ).count()

            absent = subject_attendance.filter(
                status=Attendance.STATUS_ABSENT
            ).count()

            percentage = get_attendance_percentage(
                present,
                total_classes
            )

            subject_data.append(
                {
                    "subject_id": subject_id,
                    "subject_code": (
                        subject.subject_code
                        if subject else None
                    ),
                    "subject_name": (
                        subject.name
                        if subject else None
                    ),
                    "total_classes": total_classes,
                    "present": present,
                    "absent": absent,
                    "attendance_percentage": percentage,
                    "status": get_attendance_status(percentage)
                }
            )

        return Response(
            {
                "student_id": student.student_id,
                "student_name": student.name,
                "subjects": subject_data
            }
        )


# =========================================================
# 4. STUDENT ATTENDANCE DASHBOARD
# =========================================================

class StudentAttendanceDashboardView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):

        role = getattr(
            request.user,
            "role",
            None
        )

        student = get_object_or_404(
            Student,
            id=student_id
        )

        if role == "STUDENT":

            logged_in_student = get_logged_in_student(
                request
            )

            if not logged_in_student:

                return Response(
                    {
                        "detail":
                            "Student profile is not linked "
                            "to this account."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            if logged_in_student.id != student.id:

                return Response(
                    {
                        "detail":
                            "You can only access "
                            "your own dashboard."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        elif role not in [
            "FACULTY",
            "ADMIN"
        ]:

            return Response(
                {
                    "detail": "Access denied."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        today = timezone.localdate()

        attendance = (
            Attendance.objects
            .select_related("subject")
            .filter(
                student=student,
                date__lte=today
            )
            .exclude(
                date__week_day=1
            )
        )

        total_classes = attendance.count()

        present = attendance.filter(
            status=Attendance.STATUS_PRESENT
        ).count()

        absent = attendance.filter(
            status=Attendance.STATUS_ABSENT
        ).count()

        percentage = get_attendance_percentage(
            present,
            total_classes
        )

        subject_ids = (
            attendance
            .values_list(
                "subject_id",
                flat=True
            )
            .distinct()
        )

        subject_data = []

        for subject_id in subject_ids:

            subject = Subject.objects.filter(
                id=subject_id
            ).first()

            subject_attendance = attendance.filter(
                subject_id=subject_id
            )

            subject_total = subject_attendance.count()

            subject_present = subject_attendance.filter(
                status=Attendance.STATUS_PRESENT
            ).count()

            subject_absent = subject_attendance.filter(
                status=Attendance.STATUS_ABSENT
            ).count()

            subject_percentage = get_attendance_percentage(
                subject_present,
                subject_total
            )

            subject_data.append(
                {
                    "subject_id": subject_id,
                    "subject_code": (
                        subject.subject_code
                        if subject else None
                    ),
                    "subject_name": (
                        subject.name
                        if subject else None
                    ),
                    "total_classes": subject_total,
                    "present": subject_present,
                    "absent": subject_absent,
                    "attendance_percentage": subject_percentage,
                    "status": get_attendance_status(
                        subject_percentage
                    )
                }
            )

        return Response(
            {
                "student": {
                    "id": student.id,
                    "student_id": student.student_id,
                    "name": student.name
                },
                "overall": {
                    "total_classes": total_classes,
                    "present": present,
                    "absent": absent,
                    "attendance_percentage": percentage,
                    "status": get_attendance_status(percentage)
                },
                "subjects": subject_data
            }
        )


# =========================================================
# 5. STUDENT ATTENDANCE SHORTAGE
# =========================================================

class StudentAttendanceShortageView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):

        role = getattr(
            request.user,
            "role",
            None
        )

        student = get_object_or_404(
            Student,
            id=student_id
        )

        if role == "STUDENT":

            logged_in_student = get_logged_in_student(
                request
            )

            if not logged_in_student:

                return Response(
                    {
                        "detail":
                            "Student profile is not linked "
                            "to this account."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            if logged_in_student.id != student.id:

                return Response(
                    {
                        "detail":
                            "You can only access "
                            "your own shortage data."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        elif role not in [
            "FACULTY",
            "ADMIN"
        ]:

            return Response(
                {
                    "detail": "Access denied."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        today = timezone.localdate()

        attendance = (
            Attendance.objects
            .filter(
                student=student,
                date__lte=today
            )
            .exclude(
                date__week_day=1
            )
        )

        total_classes = attendance.count()

        present = attendance.filter(
            status=Attendance.STATUS_PRESENT
        ).count()

        absent = attendance.filter(
            status=Attendance.STATUS_ABSENT
        ).count()

        required_percentage = 75.0

        current_percentage = get_attendance_percentage(
            present,
            total_classes
        )

        classes_needed = 0

        if total_classes > 0:

            while (
                (
                    (present + classes_needed)
                    /
                    (total_classes + classes_needed)
                )
                * 100
                < required_percentage
            ):
                classes_needed += 1

        classes_can_miss = 0

        if current_percentage >= required_percentage:

            while (
                present
                /
                (
                    total_classes
                    +
                    classes_can_miss
                    +
                    1
                )
                * 100
                >= required_percentage
            ):
                classes_can_miss += 1

        if total_classes == 0:
            shortage_status = "NO ATTENDANCE DATA"

        elif current_percentage >= required_percentage:
            shortage_status = "SAFE"

        else:
            shortage_status = "SHORTAGE"

        return Response(
            {
                "student_id": student.student_id,
                "student_name": student.name,
                "total_classes": total_classes,
                "present": present,
                "absent": absent,
                "current_attendance": current_percentage,
                "required_attendance": required_percentage,
                "status": shortage_status,
                "classes_needed": classes_needed,
                "classes_can_miss": classes_can_miss
            }
        )


# =========================================================
# 6. ATTENDANCE ANALYTICS
# =========================================================

class AttendanceAnalyticsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        if getattr(
            request.user,
            "role",
            None
        ) != "ADMIN":

            return Response(
                {
                    "detail":
                        "Admin access required."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        today = timezone.localdate()

        attendance = (
            Attendance.objects
            .filter(
                date__lte=today
            )
            .exclude(
                date__week_day=1
            )
        )

        total_attendance_records = attendance.count()

        present_records = attendance.filter(
            status=Attendance.STATUS_PRESENT
        ).count()

        absent_records = attendance.filter(
            status=Attendance.STATUS_ABSENT
        ).count()

        overall_percentage = get_attendance_percentage(
            present_records,
            total_attendance_records
        )

        students = Student.objects.all()

        student_data = []

        safe_students = 0
        warning_students = 0
        critical_students = 0

        for student in students:

            student_attendance = attendance.filter(
                student=student
            )

            total_classes = student_attendance.count()

            present_classes = student_attendance.filter(
                status=Attendance.STATUS_PRESENT
            ).count()

            absent_classes = student_attendance.filter(
                status=Attendance.STATUS_ABSENT
            ).count()

            percentage = get_attendance_percentage(
                present_classes,
                total_classes
            )

            if total_classes == 0:

                attendance_status = "No Data"

            elif percentage >= 75:

                attendance_status = "Safe"
                safe_students += 1

            elif percentage >= 65:

                attendance_status = "Warning"
                warning_students += 1

            else:

                attendance_status = "Critical"
                critical_students += 1

            student_data.append(
                {
                    "student_id": student.student_id,
                    "student_name": student.name,
                    "usn": student.usn,
                    "total_classes": total_classes,
                    "present_classes": present_classes,
                    "absent_classes": absent_classes,
                    "attendance_percentage": percentage,
                    "status": attendance_status
                }
            )

        # -------------------------------------------------
        # SUBJECT ANALYTICS
        # -------------------------------------------------

        subjects = Subject.objects.all()

        subject_data = []

        for subject in subjects:

            subject_attendance = attendance.filter(
                subject=subject
            )

            total_classes = subject_attendance.count()

            present_classes = subject_attendance.filter(
                status=Attendance.STATUS_PRESENT
            ).count()

            absent_classes = subject_attendance.filter(
                status=Attendance.STATUS_ABSENT
            ).count()

            percentage = get_attendance_percentage(
                present_classes,
                total_classes
            )

            if total_classes == 0:
                attendance_status = "No Data"

            elif percentage >= 75:
                attendance_status = "Safe"

            elif percentage >= 65:
                attendance_status = "Warning"

            else:
                attendance_status = "Critical"

            subject_data.append(
                {
                    "subject_id": subject.id,
                    "subject_name": subject.name,
                    "subject_code": subject.subject_code,
                    "total_classes": total_classes,
                    "present_classes": present_classes,
                    "absent_classes": absent_classes,
                    "attendance_percentage": percentage,
                    "status": attendance_status
                }
            )

        return Response(
            {
                "summary": {
                    "total_attendance_records":
                        total_attendance_records,
                    "present_records":
                        present_records,
                    "absent_records":
                        absent_records,
                    "overall_attendance_percentage":
                        overall_percentage,
                    "total_students":
                        students.count(),
                    "safe_students":
                        safe_students,
                    "warning_students":
                        warning_students,
                    "critical_students":
                        critical_students
                },
                "students": student_data,
                "subjects": subject_data
            }
        )


# =========================================================
# 7. ADMIN ATTENDANCE DASHBOARD
# =========================================================

class AttendanceAdminDashboardView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        if getattr(
            request.user,
            "role",
            None
        ) != "ADMIN":

            return Response(
                {
                    "detail":
                        "Admin access required."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        students = (
            Student.objects
            .all()
            .order_by("usn")
        )

        subjects = (
            Subject.objects
            .all()
            .order_by("name")
        )

        today = timezone.localdate()

        attendance = (
            Attendance.objects
            .filter(
                date__lte=today
            )
            .exclude(
                date__week_day=1
            )
        )

        total_faculty = Faculty.objects.count()

        total_records = attendance.count()

        present_records = attendance.filter(
            status=Attendance.STATUS_PRESENT
        ).count()

        absent_records = attendance.filter(
            status=Attendance.STATUS_ABSENT
        ).count()

        overall_percentage = get_attendance_percentage(
            present_records,
            total_records
        )

        safe_students = 0
        warning_students = 0
        critical_students = 0
        no_data_students = 0

        student_data = []
        shortage_students = []

        for student in students:

            student_attendance = attendance.filter(
                student=student
            )

            total_classes = student_attendance.count()

            present = student_attendance.filter(
                status=Attendance.STATUS_PRESENT
            ).count()

            absent = student_attendance.filter(
                status=Attendance.STATUS_ABSENT
            ).count()

            if total_classes == 0:

                no_data_students += 1

                student_data.append(
                    {
                        "student_id": student.student_id,
                        "student_name": student.name,
                        "usn": student.usn,
                        "total_classes": 0,
                        "present_classes": 0,
                        "absent_classes": 0,
                        "attendance_percentage": 0.0,
                        "status": "No Data"
                    }
                )

                continue

            percentage = get_attendance_percentage(
                present,
                total_classes
            )

            if percentage >= 75:

                attendance_status = "Safe"
                safe_students += 1

            elif percentage >= 65:

                attendance_status = "Warning"
                warning_students += 1

            else:

                attendance_status = "Critical"
                critical_students += 1

            student_data.append(
                {
                    "student_id": student.student_id,
                    "student_name": student.name,
                    "usn": student.usn,
                    "total_classes": total_classes,
                    "present_classes": present,
                    "absent_classes": absent,
                    "attendance_percentage": percentage,
                    "status": attendance_status
                }
            )

            if percentage < 75:

                classes_needed = 0

                while (
                    get_attendance_percentage(
                        present + classes_needed,
                        total_classes + classes_needed
                    )
                    < 75
                ):
                    classes_needed += 1

                shortage_students.append(
                    {
                        "student_id": student.student_id,
                        "student_name": student.name,
                        "usn": student.usn,
                        "total_classes": total_classes,
                        "present": present,
                        "absent": absent,
                        "attendance_percentage": percentage,
                        "classes_needed": classes_needed,
                        "status": "SHORTAGE"
                    }
                )

        shortage_students.sort(
            key=lambda student:
                student["attendance_percentage"]
        )

        # -------------------------------------------------
        # SUBJECT ANALYTICS
        # -------------------------------------------------

        subject_data = []

        for subject in subjects:

            subject_attendance = attendance.filter(
                subject=subject
            )

            total_classes = subject_attendance.count()

            present = subject_attendance.filter(
                status=Attendance.STATUS_PRESENT
            ).count()

            absent = subject_attendance.filter(
                status=Attendance.STATUS_ABSENT
            ).count()

            percentage = get_attendance_percentage(
                present,
                total_classes
            )

            if total_classes == 0:
                attendance_status = "No Data"

            elif percentage >= 75:
                attendance_status = "Safe"

            elif percentage >= 65:
                attendance_status = "Warning"

            else:
                attendance_status = "Critical"

            subject_data.append(
                {
                    "subject_id": subject.id,
                    "subject_name": subject.name,
                    "subject_code": subject.subject_code,
                    "total_classes": total_classes,
                    "present_classes": present,
                    "absent_classes": absent,
                    "attendance_percentage": percentage,
                    "status": attendance_status
                }
            )

        return Response(
            {
                "summary": {
                    "total_students": students.count(),
                    "total_faculty": total_faculty,
                    "total_subjects": subjects.count(),
                    "total_attendance_records": total_records,
                    "present_records": present_records,
                    "absent_records": absent_records,
                    "overall_attendance_percentage": overall_percentage,
                    "safe_students": safe_students,
                    "warning_students": warning_students,
                    "critical_students": critical_students,
                    "no_data_students": no_data_students
                },
                "students": student_data,
                "subjects": subject_data,
                "shortage_students": shortage_students
            }
        )


# =========================================================
# 8. UPDATE ATTENDANCE
# =========================================================

class AttendanceUpdateView(APIView):

    permission_classes = [IsAuthenticated]

    def patch(self, request, id):

        attendance = get_object_or_404(
            Attendance,
            id=id
        )

        user = request.user

        # -------------------------------------------------
        # ADMIN
        # -------------------------------------------------

        if user.role == "ADMIN":

            pass

        # -------------------------------------------------
        # FACULTY
        # -------------------------------------------------

        elif user.role == "FACULTY":

            faculty = get_logged_in_faculty(
                request
            )

            if not faculty:

                return Response(
                    {
                        "detail":
                            "Faculty profile not connected."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            assignment_exists = (
                FacultySubject.objects
                .filter(
                    faculty=faculty,
                    subject=attendance.subject
                )
                .exists()
            )

            if not assignment_exists:

                return Response(
                    {
                        "detail":
                            "You are not allowed to "
                            "update this attendance."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        else:

            return Response(
                {
                    "detail":
                        "You are not allowed to "
                        "update attendance."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        today = timezone.localdate()

        if attendance.date > today:

            return Response(
                {
                    "detail":
                        "Future attendance cannot be updated."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        new_status = request.data.get(
            "status"
        )

        if new_status not in [
            Attendance.STATUS_PRESENT,
            Attendance.STATUS_ABSENT
        ]:

            return Response(
                {
                    "detail":
                        "Status must be PRESENT or ABSENT."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        attendance.status = new_status

        attendance.save(
            update_fields=[
                "status",
                "updated_at"
            ]
        )

        create_attendance_notification(
            attendance.student
        )

        return Response(
            AttendanceSerializer(
                attendance
            ).data,
            status=status.HTTP_200_OK
        )


# =========================================================
# 9. FACULTY SUBJECT STUDENTS
# =========================================================

class FacultySubjectStudentsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, subject_id):

        # -------------------------------------------------
        # FACULTY ROLE
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
        # FACULTY
        # -------------------------------------------------

        faculty = get_logged_in_faculty(
            request
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
        # GET SELECTED ASSIGNMENT
        # -------------------------------------------------

        assignment_id = request.query_params.get(
            "assignment"
        )

        semester_id = request.query_params.get(
            "semester"
        )

        section_id = request.query_params.get(
            "section"
        )

        # -------------------------------------------------
        # SPECIFIC ASSIGNMENT
        # -------------------------------------------------

        if assignment_id:

            assignment = (
                FacultySubject.objects
                .filter(
                    id=assignment_id,
                    faculty=faculty,
                    subject_id=subject_id
                )
                .select_related(
                    "subject",
                    "department",
                    "semester",
                    "section"
                )
                .first()
            )

            if not assignment:

                return Response(
                    {
                        "detail":
                            "Invalid faculty assignment."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # -------------------------------------------------
        # SEMESTER + SECTION FALLBACK
        # -------------------------------------------------

        else:

            assignment_query = (
                FacultySubject.objects
                .filter(
                    faculty=faculty,
                    subject_id=subject_id
                )
            )

            if semester_id:

                assignment_query = (
                    assignment_query.filter(
                        semester_id=semester_id
                    )
                )

            if section_id:

                assignment_query = (
                    assignment_query.filter(
                        section_id=section_id
                    )
                )

            assignment = (
                assignment_query
                .select_related(
                    "subject",
                    "department",
                    "semester",
                    "section"
                )
                .order_by(
                    "semester__semester_number",
                    "section__name"
                )
                .first()
            )

            if not assignment:

                return Response(
                    {
                        "detail":
                            "You are not assigned to "
                            "this subject/class."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # -------------------------------------------------
        # LOAD ONLY STUDENTS BELONGING TO ASSIGNMENT
        # -------------------------------------------------

        students = (
            Student.objects
            .filter(
                department_id=assignment.department_id,
                semester=assignment.semester.semester_number,
                section=assignment.section.name
            )
            .order_by(
                "usn",
                "name"
            )
        )

        # -------------------------------------------------
        # STUDENT DATA
        # -------------------------------------------------

        student_data = [
            {
                "id": student.id,
                "student_id": student.student_id,
                "usn": student.usn,
                "name": student.name,
                "email": getattr(
                    student,
                    "email",
                    None
                ),
                "phone": getattr(
                    student,
                    "phone",
                    None
                ),
                "department": student.department_id,
                "semester": student.semester,
                "section": student.section
            }
            for student in students
        ]

        # -------------------------------------------------
        # RESPONSE
        #
        # IMPORTANT:
        # Return students directly so the frontend can
        # use response.students.
        # -------------------------------------------------

        return Response(
            {
                "faculty": {
                    "id":
                        faculty.id,

                    "faculty_id":
                        faculty.faculty_id,

                    "name":
                        faculty.name
                },

                "assignment": {
                    "id":
                        assignment.id,

                    "academic_year":
                        assignment.academic_year,

                    "subject": {
                        "id":
                            assignment.subject.id,

                        "subject_id":
                            assignment.subject.subject_id,

                        "subject_code":
                            assignment.subject.subject_code,

                        "name":
                            assignment.subject.name,

                        "credits":
                            assignment.subject.credits
                    },

                    "department": {
                        "id":
                            assignment.department.id,

                        "name":
                            assignment.department.name
                    },

                    "semester": {
                        "id":
                            assignment.semester.id,

                        "number":
                            assignment.semester.semester_number
                    },

                    "section": {
                        "id":
                            assignment.section.id,

                        "name":
                            assignment.section.name
                    }
                },

                "students":
                    student_data,

                "total_students":
                    len(student_data)
            }
        )


# =========================================================
# 10. FACULTY BULK ATTENDANCE
# =========================================================

class FacultyBulkAttendanceView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        # -------------------------------------------------
        # FACULTY ROLE
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
        # FACULTY
        # -------------------------------------------------

        faculty = get_logged_in_faculty(
            request
        )

        if not faculty:

            return Response(
                {
                    "detail":
                        "Faculty profile is not connected."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # -------------------------------------------------
        # REQUEST DATA
        # -------------------------------------------------

        subject_id = request.data.get(
            "subject"
        )

        assignment_id = request.data.get(
            "assignment"
        )

        session_id = request.data.get(
            "session"
        )

        attendance_list = request.data.get(
            "attendance"
        )

        # -------------------------------------------------
        # BASIC VALIDATION
        # -------------------------------------------------

        if not subject_id:

            return Response(
                {
                    "detail":
                        "Subject is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not session_id:

            return Response(
                {
                    "detail":
                        "Attendance session is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not isinstance(
            attendance_list,
            list
        ):

            return Response(
                {
                    "detail":
                        "Attendance must be a list."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(attendance_list) == 0:

            return Response(
                {
                    "detail":
                        "Attendance list cannot be empty."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # SUBJECT
        # -------------------------------------------------

        subject = get_object_or_404(
            Subject,
            id=subject_id
        )

        # -------------------------------------------------
        # ASSIGNMENT
        # -------------------------------------------------

        assignment_query = (
            FacultySubject.objects
            .filter(
                faculty=faculty,
                subject=subject
            )
        )

        if assignment_id:

            assignment_query = assignment_query.filter(
                id=assignment_id
            )

        assignment = (
            assignment_query
            .select_related(
                "department",
                "semester",
                "section"
            )
            .first()
        )

        if not assignment:

            return Response(
                {
                    "detail":
                        "You are not assigned to "
                        "this subject/class."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # -------------------------------------------------
        # SESSION
        # -------------------------------------------------

        from sessions_app.models import AttendanceSession

        session = get_object_or_404(
            AttendanceSession,
            id=session_id
        )

        # -------------------------------------------------
        # SUBJECT CHECK
        # -------------------------------------------------

        if session.subject_id != subject.id:

            return Response(
                {
                    "detail":
                        "This attendance session does not "
                        "belong to the selected subject."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # FACULTY CHECK
        # -------------------------------------------------

        if session.faculty_id != faculty.id:

            return Response(
                {
                    "detail":
                        "You are not authorized for "
                        "this attendance session."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # -------------------------------------------------
        # SEMESTER CHECK
        # -------------------------------------------------

        if (
            session.semester_id
            != assignment.semester_id
        ):

            return Response(
                {
                    "detail":
                        "This attendance session does not "
                        "belong to the assigned semester."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # -------------------------------------------------
        # SECTION CHECK
        # -------------------------------------------------

        if (
            session.section_id
            != assignment.section_id
        ):

            return Response(
                {
                    "detail":
                        "This attendance session does not "
                        "belong to the assigned section."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # -------------------------------------------------
        # DATE
        # -------------------------------------------------

        today = timezone.localdate()

        if session.attendance_date > today:

            return Response(
                {
                    "detail":
                        "Attendance cannot be marked "
                        "for a future date."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        day_error = validate_attendance_day(
            session.attendance_date
        )

        if day_error:

            return Response(
                {
                    "detail": day_error
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # PERIOD
        # -------------------------------------------------

        if (
            session.period < 1
            or session.period > 8
        ):

            return Response(
                {
                    "detail":
                        "Period must be between 1 and 8."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # VALIDATE STUDENTS
        # -------------------------------------------------

        validated_students = []

        for item in attendance_list:

            student_id = item.get(
                "student"
            )

            student_status = item.get(
                "status"
            )

            if not student_id:

                return Response(
                    {
                        "detail":
                            "Student ID is required."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            if student_status not in [
                Attendance.STATUS_PRESENT,
                Attendance.STATUS_ABSENT
            ]:

                return Response(
                    {
                        "detail":
                            "Status must be PRESENT "
                            "or ABSENT."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            student = get_object_or_404(
                Student,
                id=student_id
            )

            # Department
            if (
                student.department_id
                != assignment.department_id
            ):

                return Response(
                    {
                        "detail":
                            f"Student {student.name} "
                            "does not belong to the "
                            "assigned department."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            # Semester
            if (
                student.semester
                != assignment.semester.semester_number
            ):

                return Response(
                    {
                        "detail":
                            f"Student {student.name} "
                            "does not belong to the "
                            "assigned semester."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            # Section
            if (
                student.section
                != assignment.section.name
            ):

                return Response(
                    {
                        "detail":
                            f"Student {student.name} "
                            "does not belong to the "
                            "assigned section."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            validated_students.append(
                (
                    student,
                    student_status
                )
            )

        # -------------------------------------------------
        # SAVE
        # -------------------------------------------------

        with transaction.atomic():

            saved_records = []

            for student, student_status in validated_students:

                attendance, created = (
                    Attendance.objects
                    .update_or_create(
                        student=student,
                        session=session,
                        defaults={
                            "subject": subject,
                            "date": session.attendance_date,
                            "status": student_status
                        }
                    )
                )

                saved_records.append(
                    AttendanceSerializer(
                        attendance
                    ).data
                )

        # -------------------------------------------------
        # NOTIFICATIONS
        # -------------------------------------------------

        notified_students = set()

        for student, student_status in validated_students:

            if student.id in notified_students:
                continue

            create_attendance_notification(
                student
            )

            notified_students.add(
                student.id
            )

        # -------------------------------------------------
        # RESULT
        # -------------------------------------------------

        return Response(
            {
                "success": True,

                "message":
                    "Bulk attendance saved successfully.",

                "assignment": {
                    "id":
                        assignment.id,

                    "semester":
                        assignment.semester.semester_number,

                    "section":
                        assignment.section.name,

                    "academic_year":
                        assignment.academic_year
                },

                "subject": {
                    "id":
                        subject.id,

                    "code":
                        subject.subject_code,

                    "name":
                        subject.name
                },

                "session": {
                    "id":
                        session.id,

                    "date":
                        str(
                            session.attendance_date
                        ),

                    "period":
                        session.period,

                    "semester":
                        assignment.semester.semester_number,

                    "section":
                        assignment.section.name
                },

                "total_students":
                    len(saved_records),

                "attendance":
                    saved_records
            },
            status=status.HTTP_200_OK
        )