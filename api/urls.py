from django.urls import path

from .views import (
    FacultySubjectList,
    FacultyDashboard,
    SessionStudents,
    MarkAttendance,
    SessionAttendance,
    StudentAttendanceReport,
    SessionSummary,
    StudentDashboard,
    AttendanceShortage,
)

urlpatterns = [
    path(
        "faculty-subjects/",
        FacultySubjectList.as_view(),
        name="faculty-subjects",
    ),

    path(
        "faculty-dashboard/<int:faculty_id>/",
        FacultyDashboard.as_view(),
        name="faculty-dashboard",
    ),

    path(
        "session/<int:session_id>/students/",
        SessionStudents.as_view(),
        name="session-students",
    ),

    path(
        "attendance/mark/",
        MarkAttendance.as_view(),
        name="attendance-mark",
    ),

    path(
        "session/<int:session_id>/attendance/",
        SessionAttendance.as_view(),
        name="session-attendance",
    ),

    path(
        "student/<int:student_id>/attendance/",
        StudentAttendanceReport.as_view(),
        name="student-attendance-report",
    ),

    path(
        "session/<int:session_id>/summary/",
        SessionSummary.as_view(),
        name="session-summary",
    ),

    path(
        "student/<int:student_id>/dashboard/",
        StudentDashboard.as_view(),
        name="student-dashboard",
    ),
    path(
    "attendance/shortage/",
    AttendanceShortage.as_view(),
    name="attendance-shortage",
),
]