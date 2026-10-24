from django.urls import path
from .views import FacultyAttendance

urlpatterns = [
    path("", FacultyAttendance.as_view()),
]