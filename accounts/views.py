from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils.crypto import get_random_string
from django.core.mail import send_mail
from django.conf import settings

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .permissions import IsStudent
from students.models import Student
from faculty.models import Faculty
from parent_dashboard.models import Parent


User = get_user_model()


# =========================================================
# CUSTOM JWT LOGIN
# =========================================================

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):

    def validate(self, attrs):

        login_value = attrs.get(self.username_field)

        user = User.objects.filter(
            username=login_value
        ).first()

        if user is None:
            user = User.objects.filter(
                email__iexact=login_value
            ).first()

        if user is not None:
            attrs[self.username_field] = user.username

        return super().validate(attrs)


class CustomTokenObtainPairView(TokenObtainPairView):

    serializer_class = CustomTokenObtainPairSerializer


# =========================================================
# MY PROFILE
# =========================================================

class MyProfileView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        user = request.user

        data = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
        }

        # =================================================
        # STUDENT
        # =================================================

        if user.role == "STUDENT":

            student = Student.objects.filter(
                user=user
            ).first()

            if student:

                data["student_id"] = student.student_id
                data["student_code"] = student.student_id
                data["student_db_id"] = student.id
                data["usn"] = student.usn
                data["name"] = student.name
                data["semester"] = student.semester
                data["section"] = student.section
                data["department"] = student.department_id

        # =================================================
        # FACULTY
        # =================================================

        elif user.role == "FACULTY":

            faculty = Faculty.objects.filter(
                user=user
            ).first()

            if faculty:

                data["faculty_id"] = faculty.id
                data["faculty_code"] = faculty.faculty_id
                data["name"] = faculty.name
                data["designation"] = faculty.designation
                data["department"] = faculty.department_id

        # =================================================
        # ADMIN
        # =================================================

        elif user.role == "ADMIN":

            data["is_staff"] = user.is_staff
            data["is_superuser"] = user.is_superuser

        # =================================================
        # PARENT
        # =================================================

        elif user.role == "PARENT":

            parent = (
                Parent.objects
                .select_related("student")
                .filter(user=user)
                .first()
            )

            # Parent profile does not exist
            if not parent:

                return Response(
                    {
                        "success": False,
                        "message": "Parent profile not found."
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

            # Linked student
            student = parent.student

            # Parent information
            data["parent_id"] = parent.id
            data["parent_name"] = parent.parent_name
            data["parent_email"] = parent.email
            data["parent_phone"] = parent.phone

            # Linked student information
            data["student_db_id"] = student.id
            data["student_id"] = student.student_id
            data["student_code"] = student.student_id
            data["student_name"] = student.name
            data["student_usn"] = student.usn
            data["student_email"] = student.email
            data["student_phone"] = student.phone
            data["student_semester"] = student.semester
            data["student_section"] = student.section
            data["student_department"] = student.department.name

        return Response(data)


# =========================================================
# STUDENT ONLY
# =========================================================

class StudentOnlyView(APIView):

    permission_classes = [
        IsAuthenticated,
        IsStudent
    ]

    def get(self, request):

        return Response({
            "message": "Welcome Student",
            "username": request.user.username,
            "role": request.user.role
        })


# =========================================================
# GOOGLE FORM → STUDENT REGISTRATION
# =========================================================

class GoogleFormStudentCreate(APIView):

    permission_classes = [AllowAny]

    def post(self, request):

        data = request.data

        # -------------------------------------------------
        # GET FORM DATA
        # -------------------------------------------------

        student_id = str(
            data.get("student_id", "")
        ).strip()

        name = str(
            data.get("name", "")
        ).strip()

        usn = str(
            data.get("usn", "")
        ).strip()

        email = str(
            data.get("email", "")
        ).strip()

        phone = str(
            data.get("phone", "")
        ).strip()

        address = str(
            data.get("address", "")
        ).strip()

        section = str(
            data.get("section", "")
        ).strip()

        department_id = data.get("department")

        semester = data.get("semester")

        # -------------------------------------------------
        # REQUIRED FIELD CHECK
        # -------------------------------------------------

        required_fields = {
            "student_id": student_id,
            "name": name,
            "usn": usn,
            "email": email,
            "phone": phone,
            "department": department_id,
            "semester": semester,
            "section": section,
        }

        missing_fields = [
            field
            for field, value in required_fields.items()
            if value in [None, ""]
        ]

        if missing_fields:

            return Response(
                {
                    "success": False,
                    "message": "Missing required fields.",
                    "missing_fields": missing_fields,
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # DUPLICATE STUDENT ID
        # -------------------------------------------------

        if Student.objects.filter(
            student_id=student_id
        ).exists():

            return Response(
                {
                    "success": False,
                    "message": "Student ID already exists."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # DUPLICATE USN
        # -------------------------------------------------

        if Student.objects.filter(
            usn=usn
        ).exists():

            return Response(
                {
                    "success": False,
                    "message": "USN already exists."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # DUPLICATE STUDENT EMAIL
        # -------------------------------------------------

        if Student.objects.filter(
            email=email
        ).exists():

            return Response(
                {
                    "success": False,
                    "message": "Student email already exists."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # DUPLICATE USERNAME
        # -------------------------------------------------

        if User.objects.filter(
            username=student_id
        ).exists():

            return Response(
                {
                    "success": False,
                    "message":
                        "A login account already exists "
                        "for this Student ID."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # DUPLICATE USER EMAIL
        # -------------------------------------------------

        if User.objects.filter(
            email__iexact=email
        ).exists():

            return Response(
                {
                    "success": False,
                    "message":
                        "A user account already exists "
                        "with this email."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # CREATE USER + STUDENT
        # -------------------------------------------------

        try:

            with transaction.atomic():

                # -----------------------------------------
                # GENERATE TEMPORARY PASSWORD
                # -----------------------------------------

                temporary_password = get_random_string(
                    length=12
                )

                # -----------------------------------------
                # CREATE LOGIN USER
                # -----------------------------------------

                user = User.objects.create_user(

                    username=student_id,

                    email=email,

                    password=temporary_password,

                    role="STUDENT",

                    is_active=True,
                )

                # -----------------------------------------
                # VERIFY PASSWORD
                # -----------------------------------------

                if not user.check_password(
                    temporary_password
                ):

                    raise ValueError(
                        "Password verification failed."
                    )

                # -----------------------------------------
                # CREATE STUDENT PROFILE
                # -----------------------------------------

                student = Student.objects.create(

                    user=user,

                    student_id=student_id,

                    usn=usn,

                    name=name,

                    email=email,

                    phone=phone,

                    address=address,

                    semester=int(semester),

                    section=section,

                    department_id=int(
                        department_id
                    ),
                )

                # -----------------------------------------
                # SEND LOGIN EMAIL
                # -----------------------------------------

                subject = (
                    "AI Attendance System - "
                    "Student Login Credentials"
                )

                message = f"""
Hello {name},

Your student account has been created successfully
in the AI Based Student Attendance Monitoring System.

LOGIN DETAILS
------------------------------

Student ID / Username:
{student_id}

Temporary Password:
{temporary_password}

Email:
{email}

USN:
{usn}

Semester:
{semester}

Section:
{section}

You can use these credentials to log in to the
Student Portal.

Please keep your login credentials secure.

Regards,
AI Attendance System
"""

                send_mail(
                    subject=subject,
                    message=message,
                    from_email=getattr(
                        settings,
                        "DEFAULT_FROM_EMAIL",
                        settings.EMAIL_HOST_USER
                    ),
                    recipient_list=[email],
                    fail_silently=False,
                )

        except Exception as error:

            return Response(
                {
                    "success": False,
                    "message":
                        "Student registration failed.",
                    "error":
                        str(error),
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # -------------------------------------------------
        # SUCCESS RESPONSE
        # -------------------------------------------------

        return Response(
            {
                "success": True,

                "message":
                    "Student account created successfully "
                    "and login credentials sent by email.",

                "student": {

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

                    "address":
                        student.address,

                    "semester":
                        student.semester,

                    "section":
                        student.section,

                    "department":
                        student.department_id,

                    "department_name":
                        student.department.name,

                    "created_at":
                        student.created_at,
                },

                "login": {

                    "username":
                        user.username,

                    "email_sent":
                        True,
                },
            },
            status=status.HTTP_201_CREATED
        )