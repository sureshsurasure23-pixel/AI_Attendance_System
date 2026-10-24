from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from students.models import Student
from ai_prediction.predictor import predict_student


class StudentChatbot(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        student_id = request.data.get("student_id")
        question = request.data.get("question", "").lower()

        student = Student.objects.get(id=student_id)

        if "prediction" in question or "risk" in question:

            return Response(predict_student(student))

        return Response({
            "answer": "Ask about prediction or attendance risk."
        })