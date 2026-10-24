from django.db import models
from faculty.models import Faculty
from subjects.models import Subject
from departments.models import Department
from academic.models import Semester, Section


class FacultySubject(models.Model):
    faculty = models.ForeignKey(
        Faculty,
        on_delete=models.CASCADE
    )

    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE
    )

    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE
    )

    semester = models.ForeignKey(
        Semester,
        on_delete=models.CASCADE
    )

    section = models.ForeignKey(
        Section,
        on_delete=models.CASCADE
    )

    academic_year = models.CharField(max_length=20)

    def __str__(self):
        return f"{self.faculty} - {self.subject}"