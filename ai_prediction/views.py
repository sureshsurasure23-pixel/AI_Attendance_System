from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from students.models import Student
from attendance.models import Attendance
from marks.models import Mark

from ai_prediction.predictor import predict_student


# =========================================================
# HELPER FUNCTIONS
# =========================================================

def get_student(student_id):
    return Student.objects.get(id=student_id)


def get_attendance_data(student):
    """
    Get attendance using the actual Attendance model.

    Status values:
        PRESENT
        ABSENT

    Sunday attendance is excluded.
    """

    attendance_records = (
        Attendance.objects
        .filter(student=student)
        .exclude(date__week_day=1)
    )

    total_classes = attendance_records.count()

    present = attendance_records.filter(
        status=Attendance.STATUS_PRESENT
    ).count()

    absent = attendance_records.filter(
        status=Attendance.STATUS_ABSENT
    ).count()

    if total_classes > 0:
        percentage = round(
            (present / total_classes) * 100,
            2
        )
    else:
        percentage = 0.0

    return (
        attendance_records,
        total_classes,
        present,
        absent,
        percentage
    )


def get_attendance_risk(percentage):

    if percentage >= 75:
        return "LOW"

    elif percentage >= 60:
        return "MEDIUM"

    return "CRITICAL"


def get_academic_data(student):

    marks = Mark.objects.filter(
        student=student
    )

    subjects_count = marks.count()

    if subjects_count > 0:

        average_marks = round(
            sum(
                float(mark.percentage or 0)
                for mark in marks
            ) / subjects_count,
            2
        )

    else:

        average_marks = 0.0

    return marks, subjects_count, average_marks


def get_academic_risk(average_marks):

    if average_marks >= 75:
        return "LOW"

    elif average_marks >= 50:
        return "MEDIUM"

    return "CRITICAL"


# =========================================================
# ATTENDANCE SHORTAGE CALCULATION
# =========================================================

def calculate_classes_to_attend(
    present,
    total_classes,
    target_percentage=75
):
    """
    Calculate the minimum number of consecutive classes
    a student must attend to reach the target percentage.

    Example:

        Present = 5
        Total = 9

        5 / 9 = 55.56%

        After attending 7 more classes:

        (5 + 7) / (9 + 7)
        = 12 / 16
        = 75%

    Therefore:
        classes_to_attend = 7
    """

    if total_classes <= 0:
        return 0

    current_percentage = (
        present / total_classes
    ) * 100

    if current_percentage >= target_percentage:
        return 0

    classes_needed = 0

    while True:

        classes_needed += 1

        future_present = (
            present +
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

        if future_percentage >= target_percentage:
            break

    return classes_needed


def build_attendance_shortage(
    present,
    total_classes,
    current_percentage,
    target_percentage=75
):
    """
    Build a consistent attendance shortage response.

    This function intentionally uses the same attendance
    values returned by get_attendance_data().
    """

    classes_to_attend = calculate_classes_to_attend(
        present,
        total_classes,
        target_percentage
    )

    if classes_to_attend > 0:

        projected_percentage = round(
            (
                (present + classes_to_attend)
                /
                (total_classes + classes_to_attend)
            ) * 100,
            2
        )

        message = (
            f"Student needs to attend "
            f"{classes_to_attend} consecutive classes "
            f"to reach {target_percentage:.1f}% attendance."
        )

        can_reach_target = True

    else:

        projected_percentage = round(
            current_percentage,
            2
        )

        message = (
            f"Student has already reached the "
            f"{target_percentage:.1f}% attendance requirement."
        )

        can_reach_target = True

    return {

        "current_percentage":
            round(current_percentage, 2),

        "required_percentage":
            target_percentage,

        "classes_to_attend":
            classes_to_attend,

        "can_reach_target":
            can_reach_target,

        "projected_percentage":
            projected_percentage,

        "message":
            message
    }


# =========================================================
# EARLY WARNING SYSTEM
# =========================================================

class EarlyWarningSystemView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):

        student = get_student(student_id)

        (
            attendance_records,
            total_classes,
            present,
            absent,
            attendance_percentage
        ) = get_attendance_data(student)

        attendance_risk = get_attendance_risk(
            attendance_percentage
        )

        marks, subjects_count, average_percentage = (
            get_academic_data(student)
        )

        academic_risk = get_academic_risk(
            average_percentage
        )

        # =====================================================
        # RISK SCORE
        # =====================================================

        risk_score = 0

        if attendance_risk == "CRITICAL":
            risk_score += 4

        elif attendance_risk == "MEDIUM":
            risk_score += 2

        if academic_risk == "CRITICAL":
            risk_score += 4

        elif academic_risk == "MEDIUM":
            risk_score += 2

        # =====================================================
        # OVERALL RISK
        # =====================================================

        if risk_score >= 6:
            overall_risk = "CRITICAL"

        elif risk_score >= 3:
            overall_risk = "HIGH"

        elif risk_score >= 1:
            overall_risk = "MEDIUM"

        else:
            overall_risk = "LOW"

        # =====================================================
        # RECOMMENDATIONS
        # =====================================================

        recommendations = []

        if attendance_percentage < 75:

            recommendations.append(
                "Improve attendance and avoid unnecessary absences."
            )

        if average_percentage < 50:

            recommendations.append(
                "Improve academic preparation and focus on examinations."
            )

        if overall_risk in ["HIGH", "CRITICAL"]:

            recommendations.append(
                "Immediate academic attention is recommended."
            )

        if not recommendations:

            recommendations.append(
                "Continue maintaining good academic performance."
            )

        return Response({

            "student": {

                "id":
                    student.id,

                "name":
                    student.name
            },

            "attendance": {

                "total_classes":
                    total_classes,

                "present":
                    present,

                "absent":
                    absent,

                "percentage":
                    attendance_percentage,

                "risk_level":
                    attendance_risk
            },

            "academic": {

                "subjects_count":
                    subjects_count,

                "average_percentage":
                    average_percentage,

                "risk_level":
                    academic_risk
            },

            "early_warning": {

                "risk_score":
                    risk_score,

                "overall_risk":
                    overall_risk
            },

            "recommendations":
                recommendations
        })


# =========================================================
# ACADEMIC IMPROVEMENT PLAN
# =========================================================

class AcademicImprovementPlanView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):

        student = get_student(student_id)

        (
            attendance_records,
            total_classes,
            present,
            absent,
            attendance_percentage
        ) = get_attendance_data(student)

        marks, subjects_count, average_marks = (
            get_academic_data(student)
        )

        attendance_risk = get_attendance_risk(
            attendance_percentage
        )

        academic_risk = get_academic_risk(
            average_marks
        )

        # =====================================================
        # OVERALL PRIORITY
        # =====================================================

        if (
            attendance_risk == "CRITICAL"
            or academic_risk == "CRITICAL"
        ):

            overall_priority = "HIGH"

        elif (
            attendance_risk == "MEDIUM"
            or academic_risk == "MEDIUM"
        ):

            overall_priority = "MEDIUM"

        else:

            overall_priority = "LOW"

        # =====================================================
        # ATTENDANCE PLAN
        # =====================================================

        if attendance_percentage < 75:

            attendance_plan = [

                "Attend all upcoming classes.",

                "Avoid unnecessary absences.",

                "Maintain at least 75% attendance."
            ]

        else:

            attendance_plan = [

                "Attendance is good.",

                "Continue attending classes regularly."
            ]

        # =====================================================
        # ACADEMIC PLAN
        # =====================================================

        if average_marks < 50:

            academic_plan = [

                "Focus on upcoming examinations.",

                "Complete assignments regularly.",

                "Practice important questions every day.",

                "Revise difficult topics regularly."
            ]

        elif average_marks < 75:

            academic_plan = [

                "Improve weak subjects.",

                "Revise lessons regularly.",

                "Practice previous examination questions."
            ]

        else:

            academic_plan = [

                "Maintain your current academic performance.",

                "Continue regular revision."
            ]

        # =====================================================
        # DAILY PLAN
        # =====================================================

        daily_plan = [

            "Attend college classes regularly.",

            "Study at least 2 hours after college.",

            "Revise difficult subjects for 1 hour.",

            "Complete assignments before deadlines.",

            "Review previous lessons regularly."
        ]

        return Response({

            "student": {

                "id":
                    student.id,

                "name":
                    student.name
            },

            "academic_status": {

                "attendance_percentage":
                    attendance_percentage,

                "average_marks":
                    average_marks,

                "attendance_risk":
                    attendance_risk,

                "academic_risk":
                    academic_risk
            },

            "improvement_plan": {

                "overall_priority":
                    overall_priority,

                "attendance":
                    attendance_plan,

                "academics":
                    academic_plan,

                "daily_plan":
                    daily_plan
            }
        })


# =========================================================
# ATTENDANCE PREDICTION
# =========================================================

class AttendancePredictionView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):

        student = get_student(student_id)

        (
            attendance_records,
            total_classes,
            present,
            absent,
            current_percentage
        ) = get_attendance_data(student)

        required_percentage = 75.0

        # =====================================================
        # NEXT 10 CLASSES ATTENDED
        # =====================================================

        future_classes = 10

        predicted_present = (
            present +
            future_classes
        )

        predicted_total = (
            total_classes +
            future_classes
        )

        if predicted_total > 0:

            predicted_percentage_if_attend = round(
                (
                    predicted_present /
                    predicted_total
                ) * 100,
                2
            )

        else:

            predicted_percentage_if_attend = 0.0

        # =====================================================
        # NEXT 5 CLASSES MISSED
        # =====================================================

        future_absences = 5

        predicted_total_miss = (
            total_classes +
            future_absences
        )

        if predicted_total_miss > 0:

            predicted_percentage_if_miss = round(
                (
                    present /
                    predicted_total_miss
                ) * 100,
                2
            )

        else:

            predicted_percentage_if_miss = 0.0

        # =====================================================
        # CLASSES NEEDED FOR 75%
        # =====================================================

        classes_needed = calculate_classes_to_attend(
            present,
            total_classes,
            required_percentage
        )

        # =====================================================
        # CLASSES THAT CAN BE MISSED
        # =====================================================

        if current_percentage >= required_percentage:

            classes_can_miss = 0

            while True:

                future_missed = (
                    classes_can_miss +
                    1
                )

                future_total = (
                    total_classes +
                    future_missed
                )

                future_percentage = (
                    present /
                    future_total
                ) * 100

                if future_percentage < required_percentage:
                    break

                classes_can_miss += 1

        else:

            classes_can_miss = 0

        # =====================================================
        # STATUS
        # =====================================================

        if current_percentage >= 75:

            status = "SAFE"

        elif current_percentage >= 60:

            status = "WARNING"

        else:

            status = "CRITICAL"

        return Response({

            "student": {

                "id":
                    student.id,

                "name":
                    student.name
            },

            "current_attendance": {

                "total_classes":
                    total_classes,

                "present":
                    present,

                "absent":
                    absent,

                "percentage":
                    current_percentage,

                "required_percentage":
                    required_percentage,

                "status":
                    status
            },

            "prediction": {

                "next_10_classes_attended": {

                    "total_classes":
                        predicted_total,

                    "present":
                        predicted_present,

                    "attendance_percentage":
                        predicted_percentage_if_attend
                },

                "next_5_classes_missed": {

                    "total_classes":
                        predicted_total_miss,

                    "present":
                        present,

                    "attendance_percentage":
                        predicted_percentage_if_miss
                }
            },

            "recovery": {

                "classes_needed_for_75_percent":
                    classes_needed,

                "classes_can_miss_while_staying_at_75_percent":
                    classes_can_miss
            }
        })


# =========================================================
# ML RISK PREDICTION
# =========================================================

class MLRiskPredictionView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):

        student = get_student(student_id)

        # =====================================================
        # ACTUAL ATTENDANCE DATA
        # =====================================================

        (
            attendance_records,
            total_classes,
            present,
            absent,
            attendance_percentage
        ) = get_attendance_data(student)

        # =====================================================
        # AI PREDICTION
        # =====================================================

        prediction = predict_student(
            student
        )

        # =====================================================
        # CORRECT ATTENDANCE SHORTAGE
        # =====================================================

        attendance_shortage = build_attendance_shortage(
            present=present,
            total_classes=total_classes,
            current_percentage=attendance_percentage,
            target_percentage=75
        )

        return Response({

            "student": {

                "id":
                    student.id,

                "name":
                    student.name
            },

            "attendance": {

                "total_classes":
                    total_classes,

                "present":
                    present,

                "absent":
                    absent,

                "percentage":
                    attendance_percentage
            },

            "academic": {

                "average_marks":
                    prediction["average_marks"]
            },

            "ai_prediction": {

                "risk_level":
                    prediction["ai_risk"],

                "confidence":
                    prediction["confidence"],

                "prediction_status":
                    prediction["prediction_status"],

                "reason":
                    prediction["reason"]
            },

            "attendance_shortage": {

                "current_percentage":
                    attendance_shortage[
                        "current_percentage"
                    ],

                "required_percentage":
                    attendance_shortage[
                        "required_percentage"
                    ],

                "classes_to_attend":
                    attendance_shortage[
                        "classes_to_attend"
                    ],

                "can_reach_target":
                    attendance_shortage[
                        "can_reach_target"
                    ],

                "projected_percentage":
                    attendance_shortage[
                        "projected_percentage"
                    ],

                "message":
                    attendance_shortage[
                        "message"
                    ]
            }
        })


# =========================================================
# AI DASHBOARD
# =========================================================

class AIDashboardView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):

        student = get_student(student_id)

        # =====================================================
        # ATTENDANCE
        # =====================================================

        (
            attendance_records,
            total_classes,
            present,
            absent,
            attendance_percentage
        ) = get_attendance_data(student)

        attendance_risk = get_attendance_risk(
            attendance_percentage
        )

        # =====================================================
        # ACADEMIC
        # =====================================================

        marks, subjects_count, average_marks = (
            get_academic_data(student)
        )

        academic_risk = get_academic_risk(
            average_marks
        )

        # =====================================================
        # SUBJECT DETAILS
        # =====================================================

        subjects = []

        for mark in marks:

            subject_name = "Subject"

            if hasattr(mark, "subject"):

                if mark.subject:

                    subject_name = str(
                        mark.subject
                    )

            elif hasattr(mark, "subject_name"):

                if mark.subject_name:

                    subject_name = str(
                        mark.subject_name
                    )

            elif hasattr(mark, "name"):

                if mark.name:

                    subject_name = str(
                        mark.name
                    )

            subject_marks = float(
                mark.percentage or 0
            )

            if subject_marks >= 85:

                performance = "Excellent"

            elif subject_marks >= 75:

                performance = "Good"

            elif subject_marks >= 60:

                performance = "Average"

            else:

                performance = "Needs Improvement"

            subjects.append({

                "id":
                    mark.id,

                "name":
                    subject_name,

                "marks":
                    subject_marks,

                "percentage":
                    subject_marks,

                "performance":
                    performance
            })

        # =====================================================
        # AI PREDICTION
        # =====================================================

        prediction = predict_student(
            student
        )

        # =====================================================
        # CORRECT ATTENDANCE SHORTAGE
        # =====================================================

        attendance_shortage = build_attendance_shortage(
            present=present,
            total_classes=total_classes,
            current_percentage=attendance_percentage,
            target_percentage=75
        )

        # =====================================================
        # EARLY WARNING RISK SCORE
        # =====================================================

        risk_score = 0

        if attendance_risk == "CRITICAL":

            risk_score += 4

        elif attendance_risk == "MEDIUM":

            risk_score += 2

        if academic_risk == "CRITICAL":

            risk_score += 4

        elif academic_risk == "MEDIUM":

            risk_score += 2

        # =====================================================
        # OVERALL RISK
        # =====================================================

        if risk_score >= 6:

            overall_risk = "CRITICAL"

        elif risk_score >= 3:

            overall_risk = "HIGH"

        elif risk_score >= 1:

            overall_risk = "MEDIUM"

        else:

            overall_risk = "LOW"

        # =====================================================
        # RECOMMENDATIONS
        # =====================================================

        recommendations = []

        if attendance_percentage < 75:

            recommendations.append(
                "Improve attendance and avoid unnecessary absences."
            )

        if average_marks < 50:

            recommendations.append(
                "Improve academic preparation and focus on examinations."
            )

        elif average_marks < 75:

            recommendations.append(
                "Focus on weak subjects and improve your examination preparation."
            )

        else:

            recommendations.append(
                "Continue maintaining good academic performance."
            )

        if overall_risk in ["HIGH", "CRITICAL"]:

            recommendations.append(
                "Immediate academic attention is recommended."
            )

        # =====================================================
        # ACADEMIC MESSAGE
        # =====================================================

        if average_marks >= 85:

            academic_message = (
                "Excellent academic performance. "
                "Continue your current study habits "
                "and maintain consistent revision."
            )

        elif average_marks >= 75:

            academic_message = (
                "Good academic performance. "
                "Continue regular revision and "
                "focus on improving weaker areas."
            )

        elif average_marks >= 50:

            academic_message = (
                "Your academic performance needs attention. "
                "Focus on weaker subjects and maintain "
                "a consistent study schedule."
            )

        else:

            academic_message = (
                "Your academic performance is below the "
                "recommended level. Immediate improvement "
                "through regular study and revision is recommended."
            )

        # =====================================================
        # RESPONSE
        # =====================================================

        return Response({

            "student": {

                "id":
                    student.id,

                "name":
                    student.name
            },

            "attendance": {

                "total_classes":
                    total_classes,

                "present":
                    present,

                "absent":
                    absent,

                "percentage":
                    attendance_percentage,

                "risk_level":
                    attendance_risk
            },

            "academic": {

                "subjects_count":
                    subjects_count,

                "average_marks":
                    average_marks,

                "risk_level":
                    academic_risk,

                "subjects":
                    subjects,

                "message":
                    academic_message
            },

            "ml_prediction": {

                "risk_level":
                    prediction["ai_risk"],

                "confidence":
                    prediction["confidence"],

                "prediction_status":
                    prediction["prediction_status"],

                "reason":
                    prediction["reason"]
            },

            "attendance_shortage":
                attendance_shortage,

            "early_warning": {

                "risk_score":
                    risk_score,

                "overall_risk":
                    overall_risk,

                "recommendations":
                    recommendations
            }
        })