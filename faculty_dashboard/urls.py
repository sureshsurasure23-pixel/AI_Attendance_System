from django.urls import path
from .views import FacultyDashboard

urlpatterns = [
    path(
        "<int:faculty_id>/",
        FacultyDashboard.as_view(),
        name="faculty-dashboard",
    ),
]