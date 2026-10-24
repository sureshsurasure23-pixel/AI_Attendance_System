from django.contrib import admin
from django.urls import path, include

urlpatterns = [

    path("admin/", admin.site.urls),

    path(
        "attendance/",
        include("attendance.urls")
    ),

    path(
        "student-profile/",
        include("students.urls")
    ),

    path(
        "subjects/",
        include("subjects.urls")
    ),

    path(
        "faculty/",
        include("faculty.urls")
    ),
    
    path(
    "allocations/",
    include("allocations.urls")
),
    path(
    "notifications/",
    include("notifications.urls")
),

]