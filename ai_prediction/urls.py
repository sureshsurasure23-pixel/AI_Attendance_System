from django.urls import path

from .views import (
    EarlyWarningSystemView,
    AcademicImprovementPlanView,
    AttendancePredictionView,
    MLRiskPredictionView,
    AIDashboardView,
)


urlpatterns = [

    path(
        "early-warning/student/<int:student_id>/",
        EarlyWarningSystemView.as_view(),
        name="early-warning"
    ),

    path(
        "improvement-plan/student/<int:student_id>/",
        AcademicImprovementPlanView.as_view(),
        name="academic-improvement-plan"
    ),

    path(
        "prediction/student/<int:student_id>/",
        AttendancePredictionView.as_view(),
        name="attendance-prediction"
    ),

    path(
        "ml-risk/student/<int:student_id>/",
        MLRiskPredictionView.as_view(),
        name="ml-risk"
    ),

    path(
        "dashboard/student/<int:student_id>/",
        AIDashboardView.as_view(),
        name="ai-dashboard"
    ),
]