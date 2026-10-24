from attendance.models import Attendance
from marks.models import Mark

from ai_prediction.shortage import (
    calculate_attendance_shortage
)

from ai_prediction.ml.attendance_model import (
    predict_student_risk
)


def predict_student(student):

    # =========================================================
    # ATTENDANCE
    # =========================================================

    attendance_records = Attendance.objects.filter(
        student=student
    )

    total_classes = attendance_records.count()

    present_classes = attendance_records.filter(
        status="Present"
    ).count()

    absent_classes = attendance_records.filter(
        status="Absent"
    ).count()

    if total_classes > 0:

        attendance_percentage = round(
            (present_classes / total_classes) * 100,
            2
        )

    else:

        attendance_percentage = 0.0


    # =========================================================
    # ATTENDANCE SHORTAGE PREDICTION
    # =========================================================

    attendance_shortage = calculate_attendance_shortage(

        present_classes=present_classes,

        total_classes=total_classes,

        target_percentage=75.0
    )


    # =========================================================
    # MARKS
    # =========================================================

    marks = Mark.objects.filter(
        student=student
    )

    if marks.exists():

        average_marks = round(
            sum(
                mark.percentage
                for mark in marks
            ) / marks.count(),
            2
        )

    else:

        average_marks = 0.0


    # =========================================================
    # MINIMUM DATA PROTECTION
    # =========================================================
    #
    # A prediction based on very few attendance records
    # should not be treated as a reliable ML prediction.
    #

    if total_classes < 5:

        return {

            "total_classes":
                total_classes,

            "present_classes":
                present_classes,

            "absent_classes":
                absent_classes,

            "attendance_percentage":
                attendance_percentage,

            "average_marks":
                average_marks,

            "ai_risk":
                "INSUFFICIENT_DATA",

            "confidence":
                0.0,

            "prediction_status":
                "PRELIMINARY",

            "reason":
                "At least 5 attendance records are required "
                "for a reliable AI risk prediction.",

            "attendance_shortage":
                attendance_shortage
        }


    # =========================================================
    # AI PREDICTION
    # =========================================================

    prediction, confidence = predict_student_risk(

        attendance_percentage=
            attendance_percentage,

        average_marks=
            average_marks,

        total_classes=
            total_classes,

        absent_classes=
            absent_classes
    )


    # =========================================================
    # RETURN RESULT
    # =========================================================

    return {

        "total_classes":
            total_classes,

        "present_classes":
            present_classes,

        "absent_classes":
            absent_classes,

        "attendance_percentage":
            attendance_percentage,

        "average_marks":
            average_marks,

        "ai_risk":
            prediction,

        "confidence":
            confidence,

        "prediction_status":
            "ACTIVE",

        "reason":
            "Prediction generated using attendance "
            "and academic performance data.",

        "attendance_shortage":
            attendance_shortage
    }