from django.db import models

from students.models import Student
from subjects.models import Subject
from faculty.models import Faculty


class Mark(models.Model):

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE
    )

    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE
    )

    faculty = models.ForeignKey(
        Faculty,
        on_delete=models.CASCADE
    )

    internal_marks = models.IntegerField(default=0)

    assignment_marks = models.IntegerField(default=0)

    lab_marks = models.IntegerField(default=0)

    semester_exam = models.IntegerField(default=0)

    total_marks = models.IntegerField(default=0)

    percentage = models.FloatField(default=0)

    grade = models.CharField(
        max_length=5,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        unique_together = (
            "student",
            "subject"
        )

    def __str__(self):
        return f"{self.student.name} - {self.subject.name}"

    def save(self, *args, **kwargs):

        # Calculate total marks
        self.total_marks = (
            self.internal_marks +
            self.assignment_marks +
            self.lab_marks +
            self.semester_exam
        )

        # Calculate percentage
        self.percentage = round(
            (self.total_marks / 160) * 100,
            2
        )

        # Calculate grade
        if self.percentage >= 90:
            self.grade = "A+"

        elif self.percentage >= 80:
            self.grade = "A"

        elif self.percentage >= 70:
            self.grade = "B"

        elif self.percentage >= 60:
            self.grade = "C"

        elif self.percentage >= 50:
            self.grade = "D"

        else:
            self.grade = "F"

        # Save to database
        super().save(*args, **kwargs)