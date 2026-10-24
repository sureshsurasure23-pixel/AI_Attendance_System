from django.urls import path
from .views import (
    AttendanceListCreateView,
    StudentAttendanceView,
    StudentSubjectAttendanceView,
    StudentAttendanceDashboardView,
    StudentAttendanceShortageView,
    AttendanceAnalyticsView,
    AttendanceAdminDashboardView,
    AttendanceUpdateView,
    FacultySubjectStudentsView,
    FacultyBulkAttendanceView,
)


urlpatterns = [

    # ==========================================
    # ATTENDANCE LIST / CREATE
    # ==========================================

    path(
        "",
        AttendanceListCreateView.as_view(),
        name="attendance-list-create"
    ),


    # ==========================================
    # STUDENT ATTENDANCE HISTORY
    # ==========================================

    path(
        "student/<int:student_id>/",
        StudentAttendanceView.as_view(),
        name="student-attendance"
    ),


    # ==========================================
    # FACULTY SUBJECT STUDENTS
    # ==========================================

    path(
        "faculty/subject/<int:subject_id>/students/",
        FacultySubjectStudentsView.as_view(),
        name="faculty-subject-students"
    ),
    
    path(
    "faculty/bulk/",
    FacultyBulkAttendanceView.as_view(),
    name="faculty-bulk-attendance"
),


    # ==========================================
    # UPDATE ATTENDANCE
    # ==========================================

    path(
        "<int:id>/",
        AttendanceUpdateView.as_view(),
        name="attendance-update"
    ),


    # ==========================================
    # STUDENT SUBJECT-WISE ATTENDANCE
    # ==========================================

    path(
        "student/<int:student_id>/subjects/",
        StudentSubjectAttendanceView.as_view(),
        name="student-subject-attendance"
    ),


    # ==========================================
    # STUDENT ATTENDANCE DASHBOARD
    # ==========================================

    path(
        "student/<int:student_id>/dashboard/",
        StudentAttendanceDashboardView.as_view(),
        name="student-attendance-dashboard"
    ),


    # ==========================================
    # STUDENT ATTENDANCE SHORTAGE
    # ==========================================

    path(
        "student/<int:student_id>/shortage/",
        StudentAttendanceShortageView.as_view(),
        name="student-attendance-shortage"
    ),


    # ==========================================
    # ATTENDANCE ANALYTICS
    # ==========================================

    path(
        "analytics/",
        AttendanceAnalyticsView.as_view(),
        name="attendance-analytics"
    ),


    # ==========================================
    # ADMIN ATTENDANCE DASHBOARD
    # ==========================================

    path(
        "admin/dashboard/",
        AttendanceAdminDashboardView.as_view(),
        name="attendance-admin-dashboard"
    ),
]