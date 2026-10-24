from rest_framework import serializers
from .models import Fee


class FeeSerializer(serializers.ModelSerializer):

    student_name = serializers.CharField(
        source="student.name",
        read_only=True
    )

    usn = serializers.CharField(
        source="student.usn",
        read_only=True
    )

    class Meta:
        model = Fee
        fields = [
            "id",
            "student",
            "student_name",
            "usn",
            "total_fee",
            "paid_fee",
            "balance_fee",
            "status",
            "payment_date",
            "due_date",
            "receipt_number",
            "remarks",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "balance_fee",
            "created_at",
            "updated_at",
        ]