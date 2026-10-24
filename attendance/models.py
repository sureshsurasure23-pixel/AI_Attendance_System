from django.db import models

from students.models import Student
from subjects.models import Subject
from sessions_app.models import AttendanceSession


class Attendance(models.Model):

    STATUS_PRESENT = "PRESENT"
    STATUS_ABSENT = "ABSENT"

    STATUS_CHOICES = [
        (STATUS_PRESENT, "Present"),
        (STATUS_ABSENT, "Absent"),
    ]

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="attendance_records"
    )

    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name="attendance_records"
    )

    session = models.ForeignKey(
        AttendanceSession,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="attendance_records"
    )

    date = models.DateField()

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:

        ordering = [
            "-date",
            "-id"
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "student",
                    "session"
                ],
                name="unique_student_session"
            )
        ]

    def __str__(self):

        return (
            f"{self.student.name} - "
            f"{self.subject.name} - "
            f"{self.date} - "
            f"{self.status}"
        )