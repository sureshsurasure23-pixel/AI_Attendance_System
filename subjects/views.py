from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Subject
from .serializers import SubjectSerializer


class SubjectListCreate(generics.ListCreateAPIView):

    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated]


class SubjectDetailUpdateDelete(generics.RetrieveUpdateDestroyAPIView):

    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated]

    lookup_field = "id"