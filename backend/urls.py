from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),

    path("accounts/", include("accounts.urls")),
    path("attendance/", include("attendance.urls")),
    path("sessions/", include("sessions_app.urls")),
    path("student-profile/", include("students.urls")),
    path("subjects/", include("subjects.urls")),
    path("faculty/", include("faculty.urls")),
    path("allocations/", include("allocations.urls")),
    path("notifications/", include("notifications.urls")),
    path("parent-dashboard/", include("parent_dashboard.urls")),
    path("ai/", include("ai_prediction.urls")),

    # Marks Management
    path("marks/", include("marks.urls")),

    # Fees Management
    path("fees/", include("fees.urls")),
]