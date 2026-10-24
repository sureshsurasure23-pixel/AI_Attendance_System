from django.urls import path
from .views import StudentDashboard

urlpatterns = [

    path(
        "<int:student_id>/",
        StudentDashboard.as_view()
    ),

]