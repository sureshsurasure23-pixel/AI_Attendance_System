from django.db import models
from students.models import Student
from parent_dashboard.models import Parent


class Notification(models.Model):

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="notifications"
    )

    parent = models.ForeignKey(
        Parent,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications"
    )

    title = models.CharField(
        max_length=100
    )

    message = models.TextField()

    is_read = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.student.name} - {self.title}"