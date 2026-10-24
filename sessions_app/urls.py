from django.urls import path
from .views import AttendanceSessionCreate, AttendanceSessionList

urlpatterns = [
    path(
        "start/",
        AttendanceSessionCreate.as_view(),
        name="start-attendance",
    ),

    path(
        "",
        AttendanceSessionList.as_view(),
        name="attendance-list",
    ),
]