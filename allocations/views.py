from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from faculty.models import Faculty
from .models import FacultySubject


class FacultyAssignmentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        # -----------------------------------------
        # Check faculty login
        # -----------------------------------------

        if getattr(request.user, "role", None) != "FACULTY":
            return Response(
                {
                    "detail": "Faculty access required."
                },
                status=403
            )

        # -----------------------------------------
        # Get faculty profile
        # -----------------------------------------

        faculty = Faculty.objects.filter(
            user=request.user
        ).first()

        if not faculty:
            return Response(
                {
                    "detail": "Faculty profile not found."
                },
                status=404
            )

        # -----------------------------------------
        # Get faculty assignments
        # -----------------------------------------

        assignments = (
            FacultySubject.objects
            .filter(faculty=faculty)
            .select_related(
                "subject",
                "department",
                "semester",
                "section"
            )
            .order_by(
                "semester__semester_number",
                "section__name",
                "subject__subject_code"
            )
        )

        # -----------------------------------------
        # Prepare response
        # -----------------------------------------

        assignment_data = []

        for assignment in assignments:

            assignment_data.append(
                {
                    "id": assignment.id,

                    "subject": {
                        "id": assignment.subject.id,
                        "subject_id": assignment.subject.subject_id,
                        "subject_code": assignment.subject.subject_code,
                        "name": assignment.subject.name,
                        "credits": assignment.subject.credits,
                    },

                    "department": {
                        "id": assignment.department.id,
                        "name": assignment.department.name,
                    },

                    "semester": {
                        "id": assignment.semester.id,
                        "number": assignment.semester.semester_number,
                    },

                    "section": {
                        "id": assignment.section.id,
                        "name": assignment.section.name,
                    },

                    "academic_year": assignment.academic_year,
                }
            )

        return Response(
            {
                "faculty": {
                    "id": faculty.id,
                    "faculty_id": faculty.faculty_id,
                    "name": faculty.name,
                },

                "assignments": assignment_data
            }
        )