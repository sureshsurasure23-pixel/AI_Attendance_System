from django.urls import path

from .views import FacultyAssignmentsView


urlpatterns = [

    path(
        "faculty/",
        FacultyAssignmentsView.as_view(),
        name="faculty-assignments"
    ),

]