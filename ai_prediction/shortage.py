import math


def calculate_attendance_shortage(
    present_classes,
    total_classes,
    target_percentage=75.0
):

    # -------------------------------------------------
    # NO ATTENDANCE DATA
    # -------------------------------------------------

    if total_classes == 0:

        return {
            "current_percentage": 0.0,
            "required_percentage": target_percentage,
            "classes_to_attend": 0,
            "can_reach_target": True,
            "message": "No attendance records available."
        }


    # -------------------------------------------------
    # CURRENT ATTENDANCE
    # -------------------------------------------------

    current_percentage = round(
        (present_classes / total_classes) * 100,
        2
    )


    # -------------------------------------------------
    # ALREADY ABOVE TARGET
    # -------------------------------------------------

    if current_percentage >= target_percentage:

        return {
            "current_percentage": current_percentage,
            "required_percentage": target_percentage,
            "classes_to_attend": 0,
            "can_reach_target": True,
            "message": "Student has already reached the required attendance."
        }


    # -------------------------------------------------
    # CALCULATE REQUIRED CLASSES
    # -------------------------------------------------
    #
    # (present + x) / (total + x) >= target / 100
    #

    target = target_percentage / 100

    required_classes = math.ceil(
        (
            target * total_classes - present_classes
        ) / (
            1 - target
        )
    )


    # -------------------------------------------------
    # VERIFY RESULT
    # -------------------------------------------------

    final_present = present_classes + required_classes
    final_total = total_classes + required_classes

    final_percentage = round(
        (final_present / final_total) * 100,
        2
    )


    # -------------------------------------------------
    # RETURN RESULT
    # -------------------------------------------------

    return {
        "current_percentage": current_percentage,
        "required_percentage": target_percentage,
        "classes_to_attend": required_classes,
        "can_reach_target": True,
        "projected_percentage": final_percentage,
        "message": (
            f"Student needs to attend "
            f"{required_classes} consecutive classes "
            f"to reach {target_percentage}% attendance."
        )
    }