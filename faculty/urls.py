from django.urls import path

from .views import (
    FacultyListCreate,
    FacultyDetailUpdateDelete,
    FacultyDashboard,
    FacultyReports,
    FacultyGoogleForm,
)


urlpatterns = [

    path(
        "list/",
        FacultyListCreate.as_view(),
        name="faculty-list-create"
    ),

    path(
        "detail/<int:id>/",
        FacultyDetailUpdateDelete.as_view(),
        name="faculty-detail"
    ),

    path(
        "dashboard/",
        FacultyDashboard.as_view(),
        name="faculty-dashboard"
    ),

    path(
        "reports/",
        FacultyReports.as_view(),
        name="faculty-reports"
    ),

    path(
        "google-form/",
        FacultyGoogleForm.as_view(),
        name="faculty-google-form"
    ),
]