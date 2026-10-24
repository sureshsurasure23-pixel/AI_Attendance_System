from django.conf import settings
from django.db import models
from departments.models import Department


class Student(models.Model):

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="student_profile"
    )

    student_id = models.CharField(
        max_length=20,
        unique=True
    )

    usn = models.CharField(
        max_length=20,
        unique=True
    )

    name = models.CharField(
        max_length=100
    )

    email = models.EmailField(
        unique=True
    )

    phone = models.CharField(
        max_length=15
    )

    address = models.TextField(
        blank=True
    )

    semester = models.PositiveSmallIntegerField()

    section = models.CharField(
        max_length=5
    )

    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.usn} - {self.name}"