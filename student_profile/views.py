from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db import transaction
from django.core.mail import send_mail
from django.utils.crypto import get_random_string

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status

from students.models import Student
from .serializers import StudentSerializer


# =========================================================
# STUDENT DASHBOARD
# =========================================================

class StudentDashboard(APIView):

    permission_classes = [AllowAny]

    def get(self, request, id):

        student = get_object_or_404(
            Student,
            id=id
        )

        serializer = StudentSerializer(student)

        return Response(serializer.data)


# =========================================================
# STUDENT LIST + CREATE
# =========================================================

class StudentListCreate(APIView):

    permission_classes = [AllowAny]

    def get(self, request):

        students = Student.objects.all()

        serializer = StudentSerializer(
            students,
            many=True
        )

        return Response(serializer.data)

    def post(self, request):

        serializer = StudentSerializer(
            data=request.data
        )

        if serializer.is_valid():

            serializer.save()

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


# =========================================================
# STUDENT DETAIL / UPDATE / DELETE
# =========================================================

class StudentDetailUpdateDelete(APIView):

    permission_classes = [AllowAny]

    def get(self, request, id):

        student = get_object_or_404(
            Student,
            id=id
        )

        serializer = StudentSerializer(student)

        return Response(serializer.data)

    def put(self, request, id):

        student = get_object_or_404(
            Student,
            id=id
        )

        serializer = StudentSerializer(
            student,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():

            serializer.save()

            return Response({
                "message": "Student updated successfully",
                "data": serializer.data
            })

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, id):

        student = get_object_or_404(
            Student,
            id=id
        )

        student.delete()

        return Response({
            "message": "Student deleted successfully"
        })


# =========================================================
# GOOGLE FORM → STUDENT + LOGIN ACCOUNT
# =========================================================

class GoogleFormStudentCreate(APIView):

    permission_classes = [AllowAny]

    def post(self, request):

        try:

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

            department = str(
                data.get("department", "")
            ).strip()

            semester = str(
                data.get("semester", "")
            ).strip()

            section = str(
                data.get("section", "")
            ).strip()

            address = str(
                data.get("address", "")
            ).strip()


            # -------------------------------------------------
            # REQUIRED FIELD CHECK
            # -------------------------------------------------

            required_fields = {
                "student_id": student_id,
                "name": name,
                "usn": usn,
                "email": email,
                "phone": phone,
                "department": department,
                "semester": semester,
                "section": section,
                "address": address
            }

            missing_fields = [
                field
                for field, value in required_fields.items()
                if not value
            ]

            if missing_fields:

                return Response(
                    {
                        "success": False,
                        "message": "Required fields are missing.",
                        "missing_fields": missing_fields
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )


            # -------------------------------------------------
            # CHECK DUPLICATE STUDENT ID
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
            # CHECK DUPLICATE USN
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
            # GET USER MODEL
            # -------------------------------------------------

            User = get_user_model()


            # -------------------------------------------------
            # CHECK USERNAME
            # -------------------------------------------------

            if User.objects.filter(
                username=student_id
            ).exists():

                return Response(
                    {
                        "success": False,
                        "message":
                            "A login account with this Student ID already exists."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )


            # -------------------------------------------------
            # CHECK USER EMAIL
            # -------------------------------------------------

            if User.objects.filter(
                email=email
            ).exists():

                return Response(
                    {
                        "success": False,
                        "message":
                            "A login account with this email already exists."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )


            # -------------------------------------------------
            # GENERATE TEMPORARY PASSWORD
            # -------------------------------------------------

            temporary_password = get_random_string(
                length=12
            )


            # -------------------------------------------------
            # CREATE USER + STUDENT
            # -------------------------------------------------

            with transaction.atomic():

                # ---------------------------------------------
                # CREATE LOGIN ACCOUNT
                # ---------------------------------------------

                user = User.objects.create_user(
                    username=student_id,
                    email=email,
                    password=temporary_password,
                    role="STUDENT",
                    is_active=True
                )


                # ---------------------------------------------
                # VERIFY PASSWORD
                # ---------------------------------------------

                if not user.check_password(
                    temporary_password
                ):

                    raise ValueError(
                        "Student password could not be verified "
                        "after account creation."
                    )


                # ---------------------------------------------
                # STUDENT DATA
                # ---------------------------------------------

                student_data = {

                    "student_id": student_id,

                    "name": name,

                    "usn": usn,

                    "email": email,

                    "phone": phone,

                    "department": department,

                    "semester": semester,

                    "section": section,

                    "address": address
                }


                # ---------------------------------------------
                # CREATE STUDENT PROFILE
                # ---------------------------------------------

                serializer = StudentSerializer(
                    data=student_data
                )


                if not serializer.is_valid():

                    raise ValueError(
                        serializer.errors
                    )


                student = serializer.save()


                # ---------------------------------------------
                # LINK USER WITH STUDENT
                # ---------------------------------------------

                student.user = user

                student.save(
                    update_fields=["user"]
                )


            # -------------------------------------------------
            # SEND LOGIN CREDENTIALS
            # -------------------------------------------------

            send_mail(

                subject=(
                    "AI Attendance System - "
                    "Student Login Credentials"
                ),

                message=f"""
Dear {name},

Your registration for the AI-Based Students Attendance Monitoring System was successful.

Your login credentials are:

Username: {student_id}
Temporary Password: {temporary_password}

You can use these credentials to log in to the Student Portal.

Please keep your login credentials confidential.

Regards,
AI Attendance Monitoring System
""",

                from_email=None,

                recipient_list=[
                    email
                ],

                fail_silently=False
            )


            # -------------------------------------------------
            # SUCCESS RESPONSE
            # -------------------------------------------------

            return Response(

                {
                    "success": True,

                    "message":
                        "Student registered successfully and "
                        "login account created.",

                    "login": {
                        "username": student_id
                    },

                    "student":
                        StudentSerializer(
                            student
                        ).data
                },

                status=status.HTTP_201_CREATED
            )


        # =====================================================
        # ERROR HANDLING
        # =====================================================

        except Exception as error:

            print(
                "Google Form student error:",
                error
            )

            return Response(

                {
                    "success": False,

                    "message":
                        "Unable to register student.",

                    "error":
                        str(error)
                },

                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )