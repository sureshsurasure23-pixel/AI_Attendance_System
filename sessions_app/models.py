from django.db import models
from faculty.models import Faculty
from subjects.models import Subject
from academic.models import Semester, Section


class AttendanceSession(models.Model):
    faculty = models.ForeignKey(Faculty, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE)
    section = models.ForeignKey(Section, on_delete=models.CASCADE)
    attendance_date = models.DateField()

    # Period number: 1, 2, 3, ... 8
    period = models.PositiveSmallIntegerField(default=1)

    start_time = models.TimeField(auto_now_add=True)
    is_open = models.BooleanField(default=True)

    def __str__(self):
        return (
            f"{self.subject} - "
            f"{self.attendance_date} - "
            f"Period {self.period}"
        )