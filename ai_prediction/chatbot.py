from students.models import Student
from attendance.models import Attendance
from marks.models import Mark


def get_student_chat_response(student_id, question):

    student = Student.objects.filter(
        id=student_id
    ).first()

    if not student:
        return {
            "error": "Student not found"
        }

    question = question.lower()

    # -----------------------------
    # Attendance calculation
    # -----------------------------

    attendance = Attendance.objects.filter(
        student=student
    )

    total = attendance.count()

    present = attendance.filter(
        status="Present"
    ).count()

    absent = attendance.filter(
        status="Absent"
    ).count()

    if total > 0:
        percentage = round(
            (present / total) * 100,
            2
        )
    else:
        percentage = 0.0

    # -----------------------------
    # Attendance question
    # -----------------------------

    if (
        "attendance" in question
        or "present" in question
    ):

        return {
            "answer": (
                f"{student.name}, your current "
                f"attendance is {percentage}%. "
                f"You have attended {present} "
                f"out of {total} classes."
            )
        }

    # -----------------------------
    # Absent question
    # -----------------------------

    if "absent" in question:

        return {
            "answer": (
                f"You have been absent for "
                f"{absent} classes."
            )
        }

    # -----------------------------
    # 75% question
    # -----------------------------

    if (
        "75" in question
        or "required" in question
        or "eligibility" in question
    ):

        if percentage >= 75:

            return {
                "answer": (
                    "Your attendance is currently "
                    "above the required 75%."
                )
            }

        future_present = present
        future_total = total
        needed = 0

        while (
            future_total == 0
            or (future_present / future_total) * 100 < 75
        ):

            future_present += 1
            future_total += 1
            needed += 1

        return {
            "answer": (
                f"You need to attend the next "
                f"{needed} classes continuously "
                f"to reach 75% attendance."
            )
        }

    # -----------------------------
    # Performance question
    # -----------------------------

    if (
        "performance" in question
        or "marks" in question
        or "grade" in question
    ):

        marks = Mark.objects.filter(
            student=student
        )

        if marks.exists():

            average = round(
                sum(m.percentage for m in marks)
                / marks.count(),
                2
            )

        else:
            average = 0.0

        if average >= 85:
            prediction = "EXCELLENT"

        elif average >= 70:
            prediction = "GOOD"

        elif average >= 50:
            prediction = "AVERAGE"

        else:
            prediction = "POOR"

        return {
            "answer": (
                f"Your average marks percentage "
                f"is {average}%. "
                f"Your current performance level "
                f"is {prediction}."
            )
        }

    # -----------------------------
    # Risk question
    # -----------------------------

    if (
        "risk" in question
        or "danger" in question
        or "safe" in question
    ):

        if percentage < 60:
            risk = "HIGH"

        elif percentage < 75:
            risk = "MEDIUM"

        else:
            risk = "LOW"

        return {
            "answer": (
                f"Your current attendance risk "
                f"level is {risk}."
            )
        }

    # -----------------------------
    # Greeting
    # -----------------------------

    if (
        "hello" in question
        or "hi" in question
        or "hey" in question
    ):

        return {
            "answer": (
                f"Hello {student.name}! "
                "I am your AI student assistant. "
                "You can ask me about attendance, "
                "marks, performance or risk."
            )
        }

    # -----------------------------
    # Default response
    # -----------------------------

    return {
        "answer": (
            "I can help you with attendance, "
            "absences, 75% eligibility, marks, "
            "performance and attendance risk."
        )
    }