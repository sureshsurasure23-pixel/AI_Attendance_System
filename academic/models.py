from django.db import models

class Semester(models.Model):
    semester_number = models.PositiveSmallIntegerField(unique=True)

    def __str__(self):
        return f"Semester {self.semester_number}"


class Section(models.Model):
    name = models.CharField(max_length=5, unique=True)

    def __str__(self):
        return self.name