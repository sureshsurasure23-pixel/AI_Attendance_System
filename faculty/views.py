from datetime import datetime

from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils.crypto import get_random_string
from django.core.mail import send_mail
from django.db.models import Q

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Faculty
from .serializers import FacultySerializer

from subjects.models import Subject
from students.models import Student
from attendance.models import Attendance
from allocations.models import FacultySubject
from academic.models import Semester, Section


# =========================================================
# HELPER FUNCTIONS
# =========================================================

def get_faculty_assignments(faculty):

    return (
        FacultySubject.objects
        .filter(faculty=faculty)
        .select_related(
            "subject",
            "department",
            "semester",
            "section",
        )
        .order_by(
            "semester__semester_number",
            "section__name",
            "subject__subject_code",
        )
    )


def get_assignment_students(assignments):

    if not assignments:
        return Student.objects.none()

    conditions = Q()

    for assignment in assignments:

        conditions |= Q(
            department=assignment.department,
            semester=assignment.semester.semester_number,
            section=assignment.section.name,
        )

    return (
        Student.objects
        .filter(conditions)
        .distinct()
    )


def get_assignment_attendance(assignments):

    if not assignments:
        return Attendance.objects.none()

    conditions = Q()

    for assignment in assignments:

        conditions |= Q(
            subject=assignment.subject,
            student__department=assignment.department,
            student__semester=assignment.semester.semester_number,
            student__section=assignment.section.name,
        )

    return (
        Attendance.objects
        .filter(conditions)
        .distinct()
    )


def calculate_risk(percentage, total):

    if total == 0:
        return "NO DATA"

    if percentage < 75:
        return "HIGH"

    if percentage < 85:
        return "MEDIUM"

    return "LOW"


# =========================================================
# FACULTY LIST + CREATE
# =========================================================

class FacultyListCreate(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def get(self, request):

        faculties = (
            Faculty.objects
            .select_related(
                "department",
                "user"
            )
            .all()
        )

        serializer = FacultySerializer(
            faculties,
            many=True
        )

        return Response(
            serializer.data
        )

    def post(self, request):

        serializer = FacultySerializer(
            data=request.data
        )

        if serializer.is_valid():

            serializer.save()

            return Response(
                serializer.data,
                status=201
            )

        return Response(
            serializer.errors,
            status=400
        )


# =========================================================
# FACULTY DETAIL / UPDATE / DELETE
# =========================================================

class FacultyDetailUpdateDelete(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def get(self, request, id):

        faculty = get_object_or_404(
            Faculty.objects.select_related(
                "department",
                "user"
            ),
            id=id
        )

        serializer = FacultySerializer(
            faculty
        )

        return Response(
            serializer.data
        )

    def put(self, request, id):

        faculty = get_object_or_404(
            Faculty,
            id=id
        )

        serializer = FacultySerializer(
            faculty,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():

            serializer.save()

            return Response({
                "message":
                    "Faculty updated successfully",
                "data":
                    serializer.data
            })

        return Response(
            serializer.errors,
            status=400
        )

    def delete(self, request, id):

        faculty = get_object_or_404(
            Faculty,
            id=id
        )

        faculty.delete()

        return Response({
            "message":
                "Faculty deleted successfully"
        })


# =========================================================
# FACULTY DASHBOARD
# =========================================================

class FacultyDashboard(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def get(self, request):

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
                status=403
            )

        faculty = get_object_or_404(
            Faculty.objects.select_related(
                "user",
                "department"
            ),
            user=request.user
        )

        assignments = list(
            get_faculty_assignments(faculty)
        )

        students_queryset = (
            get_assignment_students(assignments)
        )

        students = list(
            students_queryset
        )

        total_students = len(students)

        attendance_records = (
            get_assignment_attendance(assignments)
            .select_related(
                "student",
                "subject",
                "session"
            )
        )

        total_attendance = attendance_records.count()

        total_present = (
            attendance_records
            .filter(status="PRESENT")
            .count()
        )

        total_absent = (
            attendance_records
            .filter(status="ABSENT")
            .count()
        )

        if total_attendance:

            attendance_percentage = round(
                total_present /
                total_attendance *
                100,
                2
            )

        else:

            attendance_percentage = 0.0

        # -------------------------------------------------
        # TODAY
        # -------------------------------------------------

        today = timezone.localdate()

        today_records = (
            attendance_records
            .filter(date=today)
        )

        today_present = (
            today_records
            .filter(status="PRESENT")
            .count()
        )

        today_absent = (
            today_records
            .filter(status="ABSENT")
            .count()
        )

        today_total = today_records.count()

        if today_total:

            today_percentage = round(
                today_present /
                today_total *
                100,
                2
            )

        else:

            today_percentage = 0.0

        # -------------------------------------------------
        # SUBJECT DATA
        # -------------------------------------------------

        subject_data = []

        for assignment in assignments:

            subject = assignment.subject

            assignment_students = (
                Student.objects.filter(
                    department=assignment.department,
                    semester=assignment.semester.semester_number,
                    section=assignment.section.name
                )
            )

            records = (
                Attendance.objects
                .filter(
                    subject=subject,
                    student__in=assignment_students
                )
            )

            subject_total = records.count()

            subject_present = (
                records
                .filter(status="PRESENT")
                .count()
            )

            subject_absent = (
                records
                .filter(status="ABSENT")
                .count()
            )

            if subject_total:

                subject_percentage = round(
                    subject_present /
                    subject_total *
                    100,
                    2
                )

            else:

                subject_percentage = 0.0

            subject_data.append({

                "assignment_id":
                    assignment.id,

                "id":
                    subject.id,

                "subject_id":
                    subject.subject_id,

                "subject_code":
                    subject.subject_code,

                "name":
                    subject.name,

                "credits":
                    subject.credits,

                "semester":
                    assignment.semester.semester_number,

                "section":
                    assignment.section.name,

                "department":
                    assignment.department.name,

                "academic_year":
                    assignment.academic_year,

                "attendance_percentage":
                    subject_percentage,

                "present":
                    subject_present,

                "absent":
                    subject_absent,

                "total_records":
                    subject_total,

                "student_count":
                    assignment_students.count()
            })

        # -------------------------------------------------
        # STUDENT DATA
        # -------------------------------------------------

        student_data = []

        for student in students:

            records = (
                attendance_records
                .filter(student=student)
            )

            student_total = records.count()

            student_present = (
                records
                .filter(status="PRESENT")
                .count()
            )

            student_absent = (
                records
                .filter(status="ABSENT")
                .count()
            )

            if student_total:

                percentage = round(
                    student_present /
                    student_total *
                    100,
                    2
                )

            else:

                percentage = 0.0

            risk = calculate_risk(
                percentage,
                student_total
            )

            student_data.append({

                "id":
                    student.id,

                "student_id":
                    student.student_id,

                "usn":
                    student.usn,

                "name":
                    student.name,

                "email":
                    student.email,

                "phone":
                    student.phone,

                "semester":
                    student.semester,

                "section":
                    student.section,

                "department":
                    student.department.name
                    if student.department
                    else "",

                "present":
                    student_present,

                "absent":
                    student_absent,

                "total":
                    student_total,

                "attendance_percentage":
                    percentage,

                "risk":
                    risk
            })

        student_data.sort(
            key=lambda student:
                student["attendance_percentage"]
        )

        # -------------------------------------------------
        # AT-RISK STUDENTS
        # -------------------------------------------------

        at_risk_students = [

            student

            for student in student_data

            if (
                student["attendance_percentage"] < 75
                and
                student["total"] > 0
            )
        ]

        # -------------------------------------------------
        # RECENT ATTENDANCE
        # -------------------------------------------------

        recent_records = (
            attendance_records
            .select_related(
                "student",
                "subject"
            )
            .order_by(
                "-date",
                "-id"
            )[:10]
        )

        recent_attendance = []

        for record in recent_records:

            period = None

            if record.session:

                period = record.session.period

            recent_attendance.append({

                "id":
                    record.id,

                "date":
                    record.date.isoformat(),

                "student_name":
                    record.student.name,

                "usn":
                    record.student.usn,

                "subject":
                    record.subject.name,

                "subject_code":
                    record.subject.subject_code,

                "status":
                    record.status,

                "period":
                    period
            })

        # -------------------------------------------------
        # ASSIGNMENT DATA
        # -------------------------------------------------

        assignment_data = []

        for assignment in assignments:

            assignment_data.append({

                "id":
                    assignment.id,

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
                },

                "academic_year":
                    assignment.academic_year
            })

        return Response({

            "faculty": {

                "id":
                    faculty.id,

                "faculty_id":
                    faculty.faculty_id,

                "name":
                    faculty.name,

                "email":
                    faculty.email,

                "phone":
                    faculty.phone,

                "designation":
                    faculty.designation,

                "department":
                    faculty.department.name
            },

            "statistics": {

                "total_students":
                    total_students,

                "total_subjects":
                    len(assignments),

                "total_assignments":
                    len(assignments),

                "total_attendance":
                    total_attendance,

                "total_present":
                    total_present,

                "total_absent":
                    total_absent,

                "attendance_percentage":
                    attendance_percentage,

                "today_total":
                    today_total,

                "today_present":
                    today_present,

                "today_absent":
                    today_absent,

                "today_percentage":
                    today_percentage,

                "at_risk_students":
                    len(at_risk_students)
            },

            "assignments":
                assignment_data,

            "subjects":
                subject_data,

            "students":
                student_data,

            "at_risk_students":
                at_risk_students,

            "recent_attendance":
                recent_attendance
        })


# =========================================================
# FACULTY REPORTS
# =========================================================

class FacultyReports(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def get(self, request):

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
                status=403
            )

        faculty = (
            Faculty.objects
            .select_related(
                "department",
                "user"
            )
            .filter(
                user=request.user
            )
            .first()
        )

        if not faculty:

            return Response(
                {
                    "error":
                        "Faculty profile not found."
                },
                status=404
            )

        from_date = request.GET.get(
            "from_date"
        )

        to_date = request.GET.get(
            "to_date"
        )

        assignments = list(
            get_faculty_assignments(faculty)
        )

        department_students = (
            get_assignment_students(assignments)
        )

        attendance_query = (
            get_assignment_attendance(assignments)
        )

        if from_date:

            try:

                parsed_from_date = (
                    datetime.strptime(
                        from_date,
                        "%Y-%m-%d"
                    ).date()
                )

                attendance_query = (
                    attendance_query
                    .filter(
                        date__gte=parsed_from_date
                    )
                )

            except ValueError:

                return Response(
                    {
                        "error":
                            "Invalid from_date. Use YYYY-MM-DD."
                    },
                    status=400
                )

        if to_date:

            try:

                parsed_to_date = (
                    datetime.strptime(
                        to_date,
                        "%Y-%m-%d"
                    ).date()
                )

                attendance_query = (
                    attendance_query
                    .filter(
                        date__lte=parsed_to_date
                    )
                )

            except ValueError:

                return Response(
                    {
                        "error":
                            "Invalid to_date. Use YYYY-MM-DD."
                    },
                    status=400
                )

        total_records = attendance_query.count()

        total_present = (
            attendance_query
            .filter(status="PRESENT")
            .count()
        )

        total_absent = (
            attendance_query
            .filter(status="ABSENT")
            .count()
        )

        if total_records:

            overall_percentage = round(
                total_present /
                total_records *
                100,
                2
            )

        else:

            overall_percentage = 0.0

        student_reports = []

        for student in department_students:

            records = (
                attendance_query
                .filter(student=student)
            )

            total = records.count()

            present = (
                records
                .filter(status="PRESENT")
                .count()
            )

            absent = (
                records
                .filter(status="ABSENT")
                .count()
            )

            if total:

                percentage = round(
                    present /
                    total *
                    100,
                    2
                )

            else:

                percentage = 0.0

            risk = calculate_risk(
                percentage,
                total
            )

            student_reports.append({

                "id":
                    student.id,

                "student_id":
                    student.student_id,

                "usn":
                    student.usn,

                "name":
                    student.name,

                "email":
                    student.email,

                "semester":
                    student.semester,

                "section":
                    student.section,

                "department":
                    student.department.name
                    if student.department
                    else "",

                "present":
                    present,

                "absent":
                    absent,

                "total":
                    total,

                "attendance_percentage":
                    percentage,

                "risk":
                    risk
            })

        student_reports.sort(
            key=lambda student:
                student["attendance_percentage"]
        )

        subject_reports = []

        for assignment in assignments:

            subject = assignment.subject

            assignment_students = (
                Student.objects.filter(
                    department=assignment.department,
                    semester=assignment.semester.semester_number,
                    section=assignment.section.name
                )
            )

            records = (
                attendance_query
                .filter(
                    subject=subject,
                    student__in=assignment_students
                )
            )

            total = records.count()

            present = (
                records
                .filter(status="PRESENT")
                .count()
            )

            absent = (
                records
                .filter(status="ABSENT")
                .count()
            )

            if total:

                percentage = round(
                    present /
                    total *
                    100,
                    2
                )

            else:

                percentage = 0.0

            subject_reports.append({

                "assignment_id":
                    assignment.id,

                "id":
                    subject.id,

                "subject_id":
                    subject.subject_id,

                "subject_code":
                    subject.subject_code,

                "name":
                    subject.name,

                "credits":
                    subject.credits,

                "semester":
                    assignment.semester.semester_number,

                "section":
                    assignment.section.name,

                "department":
                    assignment.department.name,

                "academic_year":
                    assignment.academic_year,

                "present":
                    present,

                "absent":
                    absent,

                "total":
                    total,

                "attendance_percentage":
                    percentage,

                "student_count":
                    assignment_students.count()
            })

        assignment_reports = []

        for assignment in assignments:

            assignment_students = (
                Student.objects.filter(
                    department=assignment.department,
                    semester=assignment.semester.semester_number,
                    section=assignment.section.name
                )
            )

            records = (
                attendance_query
                .filter(
                    subject=assignment.subject,
                    student__in=assignment_students
                )
            )

            total = records.count()

            present = (
                records
                .filter(status="PRESENT")
                .count()
            )

            absent = (
                records
                .filter(status="ABSENT")
                .count()
            )

            if total:

                percentage = round(
                    present /
                    total *
                    100,
                    2
                )

            else:

                percentage = 0.0

            assignment_reports.append({

                "id":
                    assignment.id,

                "subject":
                    assignment.subject.name,

                "subject_code":
                    assignment.subject.subject_code,

                "semester":
                    assignment.semester.semester_number,

                "section":
                    assignment.section.name,

                "department":
                    assignment.department.name,

                "academic_year":
                    assignment.academic_year,

                "students":
                    assignment_students.count(),

                "present":
                    present,

                "absent":
                    absent,

                "total":
                    total,

                "attendance_percentage":
                    percentage
            })

        recent_records = (
            attendance_query
            .select_related(
                "student",
                "subject",
                "session"
            )
            .order_by(
                "-date",
                "-id"
            )[:10]
        )

        recent_attendance = []

        for record in recent_records:

            period = None

            if record.session:

                period = record.session.period

            recent_attendance.append({

                "id":
                    record.id,

                "date":
                    record.date.isoformat(),

                "student_name":
                    record.student.name,

                "usn":
                    record.student.usn,

                "subject":
                    record.subject.name,

                "subject_code":
                    record.subject.subject_code,

                "status":
                    record.status,

                "period":
                    period
            })

        return Response({

            "faculty": {

                "id":
                    faculty.id,

                "faculty_id":
                    faculty.faculty_id,

                "name":
                    faculty.name,

                "email":
                    faculty.email,

                "phone":
                    faculty.phone,

                "designation":
                    faculty.designation,

                "department":
                    faculty.department.name
            },

            "filters": {

                "from_date":
                    from_date,

                "to_date":
                    to_date
            },

            "summary": {

                "total_students":
                    department_students.count(),

                "total_subjects":
                    len(assignments),

                "total_assignments":
                    len(assignments),

                "total_records":
                    total_records,

                "total_present":
                    total_present,

                "total_absent":
                    total_absent,

                "attendance_percentage":
                    overall_percentage
            },

            "students":
                student_reports,

            "subjects":
                subject_reports,

            "assignments":
                assignment_reports,

            "recent_attendance":
                recent_attendance
        })


# =========================================================
# GOOGLE FORM - FACULTY REGISTRATION
# =========================================================

class FacultyGoogleForm(APIView):

    permission_classes = []

    def post(self, request):

        try:

            data = request.data

            # =================================================
            # FACULTY DATA
            # =================================================

            faculty_id = str(
                data.get("faculty_id", "")
            ).strip()

            name = str(
                data.get("name", "")
            ).strip()

            email = str(
                data.get("email", "")
            ).strip()

            phone = str(
                data.get("phone", "")
            ).strip()

            designation = str(
                data.get("designation", "")
            ).strip()

            department_name = str(
                data.get("department", "")
            ).strip()

            # =================================================
            # SUBJECT DATA
            # =================================================

            subject_name = str(
                data.get("subject_name", "")
            ).strip()

            subject_code = str(
                data.get("subject_code", "")
            ).strip()

            subject_id = str(
                data.get(
                    "subject_id",
                    subject_code
                )
            ).strip()

            credits_text = str(
                data.get("credits", "")
            ).strip()

            semester_text = str(
                data.get("semester", "")
            ).strip()

            section_text = str(
                data.get("section", "")
            ).strip()

            academic_year = str(
                data.get(
                    "academic_year",
                    "2026-2027"
                )
            ).strip()

            # =================================================
            # REQUIRED FIELDS
            # =================================================

            if not faculty_id:
                return Response(
                    {
                        "success": False,
                        "message": "Faculty ID is required."
                    },
                    status=400
                )

            if not name:
                return Response(
                    {
                        "success": False,
                        "message": "Faculty Name is required."
                    },
                    status=400
                )

            if not email:
                return Response(
                    {
                        "success": False,
                        "message": "Email is required."
                    },
                    status=400
                )

            if not phone:
                return Response(
                    {
                        "success": False,
                        "message": "Phone Number is required."
                    },
                    status=400
                )

            if not designation:
                return Response(
                    {
                        "success": False,
                        "message": "Designation is required."
                    },
                    status=400
                )

            if not department_name:
                return Response(
                    {
                        "success": False,
                        "message": "Department is required."
                    },
                    status=400
                )

            if not subject_name:
                return Response(
                    {
                        "success": False,
                        "message": "Subject Name is required."
                    },
                    status=400
                )

            if not subject_code:
                return Response(
                    {
                        "success": False,
                        "message": "Subject Code is required."
                    },
                    status=400
                )

            if not credits_text:
                return Response(
                    {
                        "success": False,
                        "message": "Credits are required."
                    },
                    status=400
                )

            if not semester_text:
                return Response(
                    {
                        "success": False,
                        "message": "Semester is required."
                    },
                    status=400
                )

            if not section_text:
                return Response(
                    {
                        "success": False,
                        "message": "Section is required."
                    },
                    status=400
                )

            # =================================================
            # CREDITS
            # =================================================

            try:

                credits = int(
                    credits_text
                )

            except (ValueError, TypeError):

                return Response(
                    {
                        "success": False,
                        "message":
                            "Credits must be a number."
                    },
                    status=400
                )

            if credits <= 0:

                return Response(
                    {
                        "success": False,
                        "message":
                            "Credits must be greater than 0."
                    },
                    status=400
                )

            # =================================================
            # SEMESTER
            # =================================================

            semester_text_clean = (
                semester_text
                .replace(
                    "Semester",
                    ""
                )
                .strip()
            )

            try:

                semester_number = int(
                    semester_text_clean
                )

            except (ValueError, TypeError):

                return Response(
                    {
                        "success": False,
                        "message":
                            "Semester must be a valid number."
                    },
                    status=400
                )

            if (
                semester_number < 1
                or
                semester_number > 6
            ):

                return Response(
                    {
                        "success": False,
                        "message":
                            "Semester must be between 1 and 6."
                    },
                    status=400
                )

            # =================================================
            # DEPARTMENT MAPPING
            # =================================================

            from departments.models import Department

            department_mapping = {

                "BCA":
                    "Bachelor of Computer Applications",

                "BCA_AMIL":
                    "Bachelor of Computer Applications (AI & ML)",

                "BCA AI & ML":
                    "Bachelor of Computer Applications (AI & ML)",

                "BCA AI/ML":
                    "Bachelor of Computer Applications (AI & ML)",

                "BBA":
                    "Bachelor of Business Administration",

                "BCOM":
                    "Bachelor of Commerce",

                "B.COM":
                    "Bachelor of Commerce",

                "MBA":
                    "Master of Business Administration"
            }

            database_department_name = (
                department_mapping.get(
                    department_name.upper(),
                    department_name
                )
            )

            department_object = (
                Department.objects
                .filter(
                    name__iexact=
                        database_department_name
                )
                .first()
            )

            if not department_object:

                return Response(
                    {
                        "success": False,
                        "message":
                            f"Department '{department_name}' was not found.",
                        "database_name":
                            database_department_name
                    },
                    status=400
                )

            # =================================================
            # SEMESTER OBJECT
            # =================================================

            semester_object = (
                Semester.objects
                .filter(
                    semester_number=
                        semester_number
                )
                .first()
            )

            if not semester_object:

                return Response(
                    {
                        "success": False,
                        "message":
                            f"Semester {semester_number} does not exist."
                    },
                    status=400
                )

            # =================================================
            # SECTION OBJECT
            # =================================================

            section_object = (
                Section.objects
                .filter(
                    name__iexact=
                        section_text
                )
                .first()
            )

            if not section_object:

                return Response(
                    {
                        "success": False,
                        "message":
                            f"Section '{section_text}' does not exist."
                    },
                    status=400
                )

            # =================================================
            # FIND EXISTING FACULTY
            # =================================================

            faculty = (
                Faculty.objects
                .select_related(
                    "user",
                    "department"
                )
                .filter(
                    faculty_id=
                        faculty_id
                )
                .first()
            )

            new_faculty = False
            temporary_password = None

            # =================================================
            # EXISTING FACULTY
            # =================================================

            if faculty:

                if (
                    faculty.email.lower()
                    !=
                    email.lower()
                ):

                    return Response(
                        {
                            "success": False,
                            "message":
                                "Faculty ID already exists with a different email address."
                        },
                        status=400
                    )

                if (
                    faculty.department_id
                    !=
                    department_object.id
                ):

                    return Response(
                        {
                            "success": False,
                            "message":
                                "Faculty ID already exists under a different department."
                        },
                        status=400
                    )

            # =================================================
            # NEW FACULTY
            # =================================================

            else:

                User = get_user_model()

                if User.objects.filter(
                    username=
                        faculty_id
                ).exists():

                    return Response(
                        {
                            "success": False,
                            "message":
                                "A login account with this Faculty ID already exists."
                        },
                        status=400
                    )

                if User.objects.filter(
                    email__iexact=
                        email
                ).exists():

                    return Response(
                        {
                            "success": False,
                            "message":
                                "A login account with this email already exists."
                        },
                        status=400
                    )

                new_faculty = True

                temporary_password = (
                    get_random_string(
                        length=12
                    )
                )

            # =================================================
            # FIND EXISTING SUBJECT
            # =================================================

            existing_subject = (
                Subject.objects
                .filter(
                    subject_code=
                        subject_code
                )
                .first()
            )

            if existing_subject:

                subject = existing_subject

                if (
                    subject.department_id
                    !=
                    department_object.id
                ):

                    return Response(
                        {
                            "success": False,
                            "message":
                                "Subject Code already exists under a different department."
                        },
                        status=400
                    )

                if (
                    subject.semester
                    !=
                    semester_number
                ):

                    return Response(
                        {
                            "success": False,
                            "message":
                                "Subject Code already exists for a different semester."
                        },
                        status=400
                    )

            else:

                if Subject.objects.filter(
                    subject_id=
                        subject_id
                ).exists():

                    return Response(
                        {
                            "success": False,
                            "message":
                                "Subject ID already exists."
                        },
                        status=400
                    )

                subject = None

            # =================================================
            # CREATE FACULTY / SUBJECT / ASSIGNMENT
            # =================================================

            with transaction.atomic():

                # -------------------------------------------------
                # CREATE NEW FACULTY
                # -------------------------------------------------

                if new_faculty:

                    User = get_user_model()

                    user = User.objects.create_user(

                        username=
                            faculty_id,

                        email=
                            email,

                        password=
                            temporary_password,

                        role=
                            "FACULTY",

                        is_active=
                            True
                    )

                    faculty = Faculty.objects.create(

                        user=
                            user,

                        faculty_id=
                            faculty_id,

                        name=
                            name,

                        email=
                            email,

                        phone=
                            phone,

                        designation=
                            designation,

                        department=
                            department_object
                    )

                else:

                    faculty.name = name

                    faculty.phone = phone

                    faculty.designation = designation

                    faculty.save(
                        update_fields=[
                            "name",
                            "phone",
                            "designation"
                        ]
                    )

                # -------------------------------------------------
                # CREATE SUBJECT
                # -------------------------------------------------

                if subject is None:

                    subject = Subject.objects.create(

                        subject_id=
                            subject_id,

                        subject_code=
                            subject_code,

                        name=
                            subject_name,

                        credits=
                            credits,

                        semester=
                            semester_number,

                        department=
                            department_object,

                        faculty=
                            faculty
                    )

                else:

                    subject.faculty = faculty

                    subject.save(
                        update_fields=[
                            "faculty"
                        ]
                    )

                # -------------------------------------------------
                # DUPLICATE ASSIGNMENT CHECK
                # -------------------------------------------------

                assignment = (
                    FacultySubject.objects
                    .filter(

                        faculty=
                            faculty,

                        subject=
                            subject,

                        department=
                            department_object,

                        semester=
                            semester_object,

                        section=
                            section_object,

                        academic_year=
                            academic_year
                    )
                    .first()
                )

                if assignment:

                    return Response(
                        {
                            "success": False,
                            "message":
                                "This faculty teaching assignment already exists.",
                            "assignment_id":
                                assignment.id
                        },
                        status=400
                    )

                # -------------------------------------------------
                # CREATE ASSIGNMENT
                # -------------------------------------------------

                assignment = (
                    FacultySubject.objects.create(

                        faculty=
                            faculty,

                        subject=
                            subject,

                        department=
                            department_object,

                        semester=
                            semester_object,

                        section=
                            section_object,

                        academic_year=
                            academic_year
                    )
                )

            # =================================================
            # EMAIL NEW FACULTY
            # =================================================

            if new_faculty:

                send_mail(

                    "AI Attendance System - Faculty Login Credentials",

                    f"""
Hello {name},

Your Faculty account has been created successfully in the
AI-Based Student Attendance Monitoring System.

LOGIN DETAILS
=============

Faculty ID / Username:
{faculty_id}

Temporary Password:
{temporary_password}

TEACHING ASSIGNMENT
===================

Subject ID:
{subject.subject_id}

Subject Name:
{subject.name}

Subject Code:
{subject.subject_code}

Credits:
{subject.credits}

Semester:
{semester_number}

Section:
{section_object.name}

Academic Year:
{academic_year}

Please keep your login credentials secure.

Regards,

AI Attendance System
""",

                    None,

                    [email],

                    fail_silently=False
                )

            # =================================================
            # SUCCESS MESSAGE
            # =================================================

            if new_faculty:

                message = (
                    "New faculty, subject and teaching "
                    "assignment registered successfully. "
                    "Login credentials have been sent to "
                    "the faculty email."
                )

            else:

                message = (
                    "Existing faculty found. New subject "
                    "and teaching assignment registered "
                    "successfully."
                )

            # =================================================
            # SUCCESS RESPONSE
            # =================================================

            return Response(

                {
                    "success": True,

                    "message":
                        message,

                    "faculty": {

                        "id":
                            faculty.id,

                        "faculty_id":
                            faculty.faculty_id,

                        "name":
                            faculty.name,

                        "email":
                            faculty.email,

                        "phone":
                            faculty.phone,

                        "designation":
                            faculty.designation,

                        "department":
                            faculty.department.name
                    },

                    "subject": {

                        "id":
                            subject.id,

                        "subject_id":
                            subject.subject_id,

                        "subject_code":
                            subject.subject_code,

                        "name":
                            subject.name,

                        "credits":
                            subject.credits,

                        "semester":
                            subject.semester,

                        "department":
                            subject.department.name,

                        "faculty":
                            faculty.name
                    },

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

                    "login": {

                        "username":
                            faculty.faculty_id,

                        "email":
                            faculty.email,

                        "new_account":
                            new_faculty
                    }
                },

                status=201
            )

        except Exception as error:

            print(
                "Google Form faculty error:",
                error
            )

            return Response(

                {
                    "success": False,

                    "message":
                        "Unable to register faculty.",

                    "error":
                        str(error)
                },

                status=500
            )