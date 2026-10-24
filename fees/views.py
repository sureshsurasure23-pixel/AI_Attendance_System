from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import Fee
from .serializers import FeeSerializer


class FeeListCreate(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        fees = Fee.objects.select_related(
            "student"
        ).all()

        serializer = FeeSerializer(
            fees,
            many=True
        )

        return Response(serializer.data)

    def post(self, request):

        serializer = FeeSerializer(
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


class FeeDetailUpdateDelete(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, id):

        fee = get_object_or_404(
            Fee,
            id=id
        )

        serializer = FeeSerializer(fee)

        return Response(
            serializer.data
        )

    def put(self, request, id):

        fee = get_object_or_404(
            Fee,
            id=id
        )

        serializer = FeeSerializer(
            fee,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():

            serializer.save()

            return Response({
                "message": "Fee updated successfully",
                "data": serializer.data
            })

        return Response(
            serializer.errors,
            status=400
        )

    def delete(self, request, id):

        fee = get_object_or_404(
            Fee,
            id=id
        )

        fee.delete()

        return Response({
            "message": "Fee deleted successfully"
        })


class StudentFees(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):

        fees = Fee.objects.filter(
            student_id=student_id
        ).select_related("student")

        serializer = FeeSerializer(
            fees,
            many=True
        )

        return Response(
            serializer.data
        )