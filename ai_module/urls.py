from django.urls import path

from .views import AttendancePredictionView


urlpatterns = [

    path(
        "prediction/student/<int:student_id>/",
        AttendancePredictionView.as_view(),
        name="attendance-prediction"
    ),

]