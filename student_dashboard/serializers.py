from rest_framework import serializers


class StudentDashboardSerializer(serializers.Serializer):
    student = serializers.CharField()
    usn = serializers.CharField()
    department = serializers.CharField()
    semester = serializers.IntegerField()

    attendance = serializers.FloatField()

    total_marks = serializers.FloatField()

    pending_fee = serializers.FloatField()