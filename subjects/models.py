from django.db import models
from departments.models import Department
from faculty.models import Faculty


class Subject(models.Model):

    subject_id = models.CharField(
        max_length=20,
        unique=True
    )

    subject_code = models.CharField(
        max_length=20,
        unique=True
    )

    name = models.CharField(
        max_length=100
    )

    credits = models.PositiveSmallIntegerField(
        default=4
    )

    semester = models.PositiveSmallIntegerField()

    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE
    )

    faculty = models.ForeignKey(
        Faculty,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    def __str__(self):
        return f"{self.subject_code} - {self.name}"