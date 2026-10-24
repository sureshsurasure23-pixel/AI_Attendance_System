from attendance.models import Attendance


REQUIRED_ATTENDANCE = 75.0


def calculate_attendance(student_id):

    attendance = Attendance.objects.filter(
        student_id=student_id
    )

    total_classes = attendance.count()

    present_classes = attendance.filter(
        status="Present"
    ).count()

    absent_classes = attendance.filter(
        status="Absent"
    ).count()

    if total_classes > 0:
        percentage = (
            present_classes /
            total_classes
        ) * 100
    else:
        percentage = 0

    return {
        "total_classes": total_classes,
        "present_classes": present_classes,
        "absent_classes": absent_classes,
        "attendance_percentage": round(
            percentage,
            2
        )
    }


def predict_attendance_status(
    attendance_percentage
):

    if attendance_percentage >= 85:

        return {
            "status": "SAFE",
            "risk": "LOW",
            "message": "Attendance is healthy."
        }

    elif attendance_percentage >= 75:

        return {
            "status": "SAFE",
            "risk": "LOW",
            "message": "Attendance meets the required percentage."
        }

    elif attendance_percentage >= 65:

        return {
            "status": "WARNING",
            "risk": "MEDIUM",
            "message": "Student attendance is approaching shortage."
        }

    else:

        return {
            "status": "CRITICAL",
            "risk": "HIGH",
            "message": "Student is at high risk of attendance shortage."
        }


def calculate_classes_needed(
    present_classes,
    total_classes,
    target=REQUIRED_ATTENDANCE
):

    if total_classes == 0:

        return 0

    current_percentage = (
        present_classes /
        total_classes
    ) * 100

    if current_percentage >= target:

        return 0

    classes_needed = 0

    while True:

        future_present = (
            present_classes +
            classes_needed
        )

        future_total = (
            total_classes +
            classes_needed
        )

        future_percentage = (
            future_present /
            future_total
        ) * 100

        if future_percentage >= target:

            break

        classes_needed += 1

    return classes_needed