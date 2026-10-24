from django.db import models
from students.models import Student


class Fee(models.Model):

    STATUS_CHOICES = [
        ("Paid", "Paid"),
        ("Partial", "Partial"),
        ("Pending", "Pending"),
    ]

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="fees"
    )

    total_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    paid_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    balance_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="Pending"
    )

    payment_date = models.DateField(
        null=True,
        blank=True
    )

    due_date = models.DateField()

    receipt_number = models.CharField(
        max_length=50,
        blank=True,
        null=True
    )

    remarks = models.TextField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def save(self, *args, **kwargs):

        self.balance_fee = self.total_fee - self.paid_fee

        if self.balance_fee <= 0:
            self.status = "Paid"
        elif self.paid_fee > 0:
            self.status = "Partial"
        else:
            self.status = "Pending"

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student.name} - {self.status}"