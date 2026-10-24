from django.urls import path

from .views import (
    NotificationListCreate,
    NotificationDetailUpdateDelete,
    StudentNotifications,
    MarkNotificationRead,
)


urlpatterns = [

    # GET all notifications / POST notification
    path(
        "",
        NotificationListCreate.as_view(),
        name="notification-list-create"
    ),

    # GET / PUT / DELETE one notification
    path(
        "detail/<int:id>/",
        NotificationDetailUpdateDelete.as_view(),
        name="notification-detail"
    ),

    # Student-specific notifications
    # Example:
    # /notifications/student/STU001/
    path(
        "student/<str:student_id>/",
        StudentNotifications.as_view(),
        name="student-notifications"
    ),

    # Mark notification as read
    path(
        "<int:id>/read/",
        MarkNotificationRead.as_view(),
        name="notification-read"
    ),
]