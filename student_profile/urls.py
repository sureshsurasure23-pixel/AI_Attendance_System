from django.urls import path

from .views import (
    StudentDashboard,
    StudentListCreate,
    StudentDetailUpdateDelete,
    GoogleFormStudentCreate,
)


urlpatterns = [

    # Single student profile
    path(
        "<int:id>/",
        StudentDashboard.as_view(),
        name="student-dashboard",
    ),

    # Student list + create
    path(
        "list/",
        StudentListCreate.as_view(),
        name="student-list-create",
    ),

    # Student detail + update + delete
    path(
        "detail/<int:id>/",
        StudentDetailUpdateDelete.as_view(),
        name="student-detail",
    ),

    # Google Form → Django student registration
    path(
        "google-form/",
        GoogleFormStudentCreate.as_view(),
        name="google-form-student-create",
    ),

]