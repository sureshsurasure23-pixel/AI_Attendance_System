from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status

from .models import Student
from departments.models import Department


# =========================================================
# STUDENT LIST + CREATE
# =========================================================

class StudentListCreate(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        students = Student.objects.all().order_by("name")

        data = []

        for student in students:

            data.append({
                "id": student.id,
                "student_id": student.student_id,
                "name": student.name,
                "usn": student.usn,
                "email": student.email,
                "phone": student.phone,
                "department": (
                    student.department.name
                    if student.department
                    else None
                ),
                "semester": student.semester,
                "section": student.section,
                "address": student.address,
            })

        return Response(data, status=status.HTTP_200_OK)

    def post(self, request):

        data = request.data

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

        department_name = str(
            data.get("department", "")
        ).strip()

        semester_value = data.get("semester")

        section = str(
            data.get("section", "")
        ).strip()

        address = str(
            data.get("address", "")
        ).strip()

        if not student_id:
            return Response(
                {"error": "Student ID is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not name:
            return Response(
                {"error": "Student name is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not usn:
            return Response(
                {"error": "USN is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not email:
            return Response(
                {"error": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not department_name:
            return Response(
                {"error": "Department is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            semester = int(semester_value)

        except (TypeError, ValueError):

            return Response(
                {"error": "Invalid semester."},
                status=status.HTTP_400_BAD_REQUEST
            )

        department = Department.objects.filter(
            name__iexact=department_name
        ).first()

        if not department:

            return Response(
                {
                    "error":
                        f"Department '{department_name}' "
                        "not found."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if Student.objects.filter(
            student_id=student_id
        ).exists():

            return Response(
                {
                    "error":
                        f"Student ID '{student_id}' already exists."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if Student.objects.filter(
            usn=usn
        ).exists():

            return Response(
                {
                    "error":
                        f"USN '{usn}' already exists."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        student = Student.objects.create(

            student_id=student_id,

            name=name,

            usn=usn,

            email=email,

            phone=phone,

            department=department,

            semester=semester,

            section=section,

            address=address,
        )

        return Response(
            {
                "success": True,

                "message":
                    "Student created successfully.",

                "student": {
                    "id": student.id,
                    "student_id": student.student_id,
                    "name": student.name,
                    "usn": student.usn,
                    "email": student.email,
                    "phone": student.phone,
                    "department":
                        department.name,
                    "semester":
                        student.semester,
                    "section":
                        student.section,
                    "address":
                        student.address,
                }
            },
            status=status.HTTP_201_CREATED
        )


# =========================================================
# SINGLE STUDENT DASHBOARD
# =========================================================

class StudentDashboard(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, id):

        try:

            student = Student.objects.select_related(
                "department"
            ).get(id=id)

        except Student.DoesNotExist:

            return Response(
                {
                    "error":
                        "Student not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(
            {
                "id": student.id,

                "student_id":
                    student.student_id,

                "name":
                    student.name,

                "usn":
                    student.usn,

                "email":
                    student.email,

                "phone":
                    student.phone,

                "department":
                    (
                        student.department.name
                        if student.department
                        else None
                    ),

                "semester":
                    student.semester,

                "section":
                    student.section,

                "address":
                    student.address,
            },
            status=status.HTTP_200_OK
        )


# =========================================================
# STUDENT DETAIL / UPDATE / DELETE
# =========================================================

class StudentDetailUpdateDelete(APIView):

    permission_classes = [IsAuthenticated]

    def get_student(self, id):

        try:

            return Student.objects.get(id=id)

        except Student.DoesNotExist:

            return None

    def get(self, request, id):

        student = self.get_student(id)

        if not student:

            return Response(
                {
                    "error":
                        "Student not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(
            {
                "id": student.id,
                "student_id": student.student_id,
                "name": student.name,
                "usn": student.usn,
                "email": student.email,
                "phone": student.phone,
                "department":
                    (
                        student.department.name
                        if student.department
                        else None
                    ),
                "semester": student.semester,
                "section": student.section,
                "address": student.address,
            }
        )

    def put(self, request, id):

        student = self.get_student(id)

        if not student:

            return Response(
                {
                    "error":
                        "Student not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        data = request.data

        if "name" in data:
            student.name = data["name"]

        if "email" in data:
            student.email = data["email"]

        if "phone" in data:
            student.phone = data["phone"]

        if "semester" in data:
            student.semester = data["semester"]

        if "section" in data:
            student.section = data["section"]

        if "address" in data:
            student.address = data["address"]

        if "usn" in data:
            student.usn = data["usn"]

        if "student_id" in data:
            student.student_id = data["student_id"]

        if "department" in data:

            department = Department.objects.filter(
                name__iexact=str(
                    data["department"]
                ).strip()
            ).first()

            if not department:

                return Response(
                    {
                        "error":
                            "Department not found."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            student.department = department

        student.save()

        return Response(
            {
                "success": True,
                "message":
                    "Student updated successfully."
            },
            status=status.HTTP_200_OK
        )

    def delete(self, request, id):

        student = self.get_student(id)

        if not student:

            return Response(
                {
                    "error":
                        "Student not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        student.delete()

        return Response(
            {
                "success": True,
                "message":
                    "Student deleted successfully."
            },
            status=status.HTTP_200_OK
        )


# =========================================================
# GOOGLE FORM → STUDENT REGISTRATION
# =========================================================

class GoogleFormStudentCreate(APIView):

    permission_classes = [AllowAny]

    def post(self, request):

        try:

            print("========== GOOGLE FORM ==========")
            print("DATA:", request.data)

            student_id = str(
                request.data.get("student_id", "")
            ).strip()

            name = str(
                request.data.get("name", "")
            ).strip()

            usn = str(
                request.data.get("usn", "")
            ).strip()

            email = str(
                request.data.get("email", "")
            ).strip()

            phone = str(
                request.data.get("phone", "")
            ).strip()

            department_name = str(
                request.data.get("department", "")
            ).strip()

            semester_value = request.data.get("semester")

            section = str(
                request.data.get("section", "")
            ).strip()

            address = str(
                request.data.get("address", "")
            ).strip()

            if not student_id:
                return Response(
                    {
                        "success": False,
                        "error":
                            "Student ID is missing."
                    },
                    status=400
                )

            if not name:
                return Response(
                    {
                        "success": False,
                        "error":
                            "Student Name is missing."
                    },
                    status=400
                )

            if not usn:
                return Response(
                    {
                        "success": False,
                        "error":
                            "USN is missing."
                    },
                    status=400
                )

            if not email:
                return Response(
                    {
                        "success": False,
                        "error":
                            "Email is missing."
                    },
                    status=400
                )

            if not phone:
                return Response(
                    {
                        "success": False,
                        "error":
                            "Phone Number is missing."
                    },
                    status=400
                )

            if not department_name:
                return Response(
                    {
                        "success": False,
                        "error":
                            "Department is missing."
                    },
                    status=400
                )

            if not semester_value:
                return Response(
                    {
                        "success": False,
                        "error":
                            "Semester is missing."
                    },
                    status=400
                )

            if not section:
                return Response(
                    {
                        "success": False,
                        "error":
                            "Section is missing."
                    },
                    status=400
                )

            try:

                semester = int(
                    semester_value
                )

            except (TypeError, ValueError):

                return Response(
                    {
                        "success": False,
                        "error":
                            f"Invalid semester: "
                            f"{semester_value}"
                    },
                    status=400
                )

            if semester < 1 or semester > 6:

                return Response(
                    {
                        "success": False,
                        "error":
                            "Semester must be between 1 and 6."
                    },
                    status=400
                )

            department_mapping = {

                "BCA":
                    "Bachelor of Computer Applications",

                "BCA_AMIL":
                    "Bachelor of Computer Applications (AI & ML)",

                "BBA":
                    "Bachelor of Business Administration",

                "BCOM":
                    "Bachelor of Commerce",

                "MBA":
                    "Master of Business Administration",
            }

            database_department_name = (
                department_mapping.get(
                    department_name.upper(),
                    department_name
                )
            )

            department = Department.objects.filter(
                name__iexact=
                    database_department_name
            ).first()

            if not department:

                departments = list(
                    Department.objects.values_list(
                        "name",
                        flat=True
                    )
                )

                return Response(
                    {
                        "success": False,

                        "error":
                            f"Department "
                            f"'{department_name}' "
                            "could not be matched.",

                        "available_departments":
                            departments
                    },
                    status=400
                )

            if Student.objects.filter(
                student_id=student_id
            ).exists():

                return Response(
                    {
                        "success": False,
                        "error":
                            f"Student ID "
                            f"'{student_id}' "
                            "already exists."
                    },
                    status=400
                )

            if Student.objects.filter(
                usn=usn
            ).exists():

                return Response(
                    {
                        "success": False,
                        "error":
                            f"USN '{usn}' "
                            "already exists."
                    },
                    status=400
                )

            if Student.objects.filter(
                email=email
            ).exists():

                return Response(
                    {
                        "success": False,
                        "error":
                            f"Email '{email}' "
                            "already exists."
                    },
                    status=400
                )

            student = Student.objects.create(

                student_id=student_id,

                name=name,

                usn=usn,

                email=email,

                phone=phone,

                department=department,

                semester=semester,

                section=section,

                address=address,
            )

            return Response(
                {
                    "success": True,

                    "message":
                        "Student registered successfully.",

                    "student": {

                        "id":
                            student.id,

                        "student_id":
                            student.student_id,

                        "name":
                            student.name,

                        "usn":
                            student.usn,

                        "email":
                            student.email,

                        "department":
                            department.name,

                        "semester":
                            semester,

                        "section":
                            section,
                    }
                },

                status=status.HTTP_201_CREATED
            )

        except Exception as error:

            print(
                "========== UNEXPECTED ERROR =========="
            )

            print(
                repr(error)
            )

            print(
                "======================================"
            )

            return Response(
                {
                    "success": False,
                    "error": str(error),
                },
                status=500
            )