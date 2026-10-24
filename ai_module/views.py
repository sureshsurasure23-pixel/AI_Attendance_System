from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from students.models import Student

from .services import (
    calculate_attendance,
    predict_attendance_status,
    calculate_classes_needed,
)


class AttendancePredictionView(APIView):

    permission_classes = [IsAuthenticated]

    # GET /ai/prediction/student/<student_id>/

    def get(self, request, student_id):

        student = Student.objects.filter(
            id=student_id
        ).first()

        if not student:

            return Response(
                {
                    "error": "Student not found"
                },
                status=404
            )

        attendance = calculate_attendance(
            student_id
        )

        prediction = predict_attendance_status(
            attendance["attendance_percentage"]
        )

        classes_needed = calculate_classes_needed(
            attendance["present_classes"],
            attendance["total_classes"]
        )

        return Response({

            "student": {
                "id": student.id,
                "name": student.name,
                "usn": student.usn
            },

            "attendance": attendance,

            "prediction": prediction,

            "required_attendance": 75.0,

            "classes_needed": classes_needed
        })