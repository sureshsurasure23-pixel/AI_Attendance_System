from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):

    ROLE_CHOICES = (
    ("ADMIN", "Admin"),
    ("FACULTY", "Faculty"),
    ("STUDENT", "Student"),
    ("PARENT", "Parent"),
)

    groups = models.ManyToManyField(
        "auth.Group",
        related_name="accounts_users",
        blank=True,
    )

    user_permissions = models.ManyToManyField(
        "auth.Permission",
        related_name="accounts_users_permissions",
        blank=True,
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="STUDENT",
    )

    def __str__(self):
        return self.username