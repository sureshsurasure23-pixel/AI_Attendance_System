from django.conf import settings
from django.db import models

from students.models import Student


class Parent(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="parent_profile",
        null=True,
        blank=True
    )

    parent_name = models.CharField(max_length=100)

    email = models.EmailField(
        blank=True,
        null=True
    )

    phone = models.CharField(
        max_length=15,
        blank=True,
        null=True
    )

    student = models.OneToOneField(
        Student,
        on_delete=models.CASCADE,
        related_name="parent"
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.parent_name} - {self.student.name}"