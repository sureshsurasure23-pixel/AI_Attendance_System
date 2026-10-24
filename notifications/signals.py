from django.db.models.signals import post_save
from django.dispatch import receiver

from attendance.models import Attendance


@receiver(post_save, sender=Attendance)
def check_attendance_shortage(
    sender,
    instance,
    created,
    **kwargs
):
    # Attendance notifications are handled by
    # attendance.views.create_attendance_notification().
    #
    # This signal is intentionally disabled to prevent
    # duplicate or incorrect attendance notifications.
    return