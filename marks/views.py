from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404

from marks.models import Mark
from .serializers import MarkSerializer


class MarkListCreate(APIView):

    permission_classes = [AllowAny]

    def get(self, request):

        marks = Mark.objects.all()

        serializer = MarkSerializer(
            marks,
            many=True
        )

        return Response(serializer.data)

    def post(self, request):

        serializer = MarkSerializer(
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


class MarkDetailUpdateDelete(APIView):

    permission_classes = [AllowAny]

    def get(self, request, id):

        mark = get_object_or_404(
            Mark,
            id=id
        )

        serializer = MarkSerializer(mark)

        return Response(serializer.data)

    def put(self, request, id):

        mark = get_object_or_404(
            Mark,
            id=id
        )

        serializer = MarkSerializer(
            mark,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():

            serializer.save()

            return Response({
                "message": "Marks updated successfully",
                "data": serializer.data
            })

        return Response(
            serializer.errors,
            status=400
        )

    def delete(self, request, id):

        mark = get_object_or_404(
            Mark,
            id=id
        )

        mark.delete()

        return Response({
            "message": "Marks deleted successfully"
        })