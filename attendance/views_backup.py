from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import Attendance
from .serializers import AttendanceSerializer

from students.models import Student
from subjects.models import Subject
from faculty.models import Faculty


# =========================================================
# Helper Functions
# =========================================================

def get_attendance_percentage(present, total):
    """
    Calculate attendance percentage.
    """
    if total == 0:
        return 0.0

    return round((present / total) * 100, 2)


def get_attendance_status(percentage):
    """
    Attendance status based on 75% requirement.
    """

    if percentage >= 75:
        return "SAFE"

    elif percentage >= 65:
        return "WARNING"

    return "CRITICAL"


# =========================================================
# 1. Attendance List + Create
# =========================================================

class AttendanceListCreateView(APIView):

    permission_classes = [IsAuthenticated]

    # -----------------------------------------------------
    # GET /attendance/
    # -----------------------------------------------------

    def get(self, request):

        attendance = Attendance.objects.select_related(
            "student",
            "subject"
        ).all().order_by("-date")

        serializer = AttendanceSerializer(
            attendance,
            many=True
        )

        return Response(serializer.data)

    # -----------------------------------------------------
    # POST /attendance/
    # -----------------------------------------------------

    def post(self, request):

        serializer = AttendanceSerializer(
            data=request.data
        )

        if serializer.is_valid():

            serializer.save()

            return Response(
                {
                    "message": "Attendance marked successfully",
                    "data": serializer.data
                },
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


# =========================================================
# 2. Student Attendance History
# =========================================================

class StudentAttendanceView(APIView):

    permission_classes = [IsAuthenticated]

    # GET /attendance/student/<student_id>/

    def get(self, request, student_id):

        student = get_object_or_404(
            Student,
            id=student_id
        )

        attendance = Attendance.objects.select_related(
            "student",
            "subject"
        ).filter(
            student=student
        ).order_by("-date")

        total_classes = attendance.count()

        present = attendance.filter(
            status="Present"
        ).count()

        absent = attendance.filter(
            status="Absent"
        ).count()

        percentage = get_attendance_percentage(
            present,
            total_classes
        )

        attendance_status = get_attendance_status(
            percentage
        )

        serializer = AttendanceSerializer(
            attendance,
            many=True
        )

        return Response(
            {
                "student_id": student.id,
                "student_name": student.name,

                "total_classes": total_classes,

                "present": present,

                "absent": absent,

                "attendance_percentage": percentage,

                "status": attendance_status,

                "records": serializer.data
            }
        )


# =========================================================
# 3. Student Subject-wise Attendance
# =========================================================

class StudentSubjectAttendanceView(APIView):

    permission_classes = [IsAuthenticated]

    # GET /attendance/student/<student_id>/subjects/

    def get(self, request, student_id):

        student = get_object_or_404(
            Student,
            id=student_id
        )

        attendance = Attendance.objects.select_related(
            "subject"
        ).filter(
            student=student
        )

        subject_ids = attendance.values_list(
            "subject_id",
            flat=True
        ).distinct()

        subject_data = []

        for subject_id in subject_ids:

            subject = Subject.objects.filter(
                id=subject_id
            ).first()

            subject_attendance = attendance.filter(
                subject_id=subject_id
            )

            total_classes = subject_attendance.count()

            present = subject_attendance.filter(
                status="Present"
            ).count()

            absent = subject_attendance.filter(
                status="Absent"
            ).count()

            percentage = get_attendance_percentage(
                present,
                total_classes
            )

            attendance_status = get_attendance_status(
                percentage
            )

            subject_data.append(
                {
                    "subject_id": subject_id,

                    "subject_code": (
                        subject.subject_code
                        if subject
                        else None
                    ),

                    "subject_name": (
                        subject.name
                        if subject
                        else None
                    ),

                    "total_classes": total_classes,

                    "present": present,

                    "absent": absent,

                    "attendance_percentage": percentage,

                    "status": attendance_status
                }
            )

        return Response(
            {
                "student_id": student.id,

                "student_name": student.name,

                "subjects": subject_data
            }
        )


# =========================================================
# 4. Student Attendance Dashboard
# =========================================================

class StudentAttendanceDashboardView(APIView):

    permission_classes = [IsAuthenticated]

    # GET /attendance/student/<student_id>/dashboard/

    def get(self, request, student_id):

        student = get_object_or_404(
            Student,
            id=student_id
        )

        attendance = Attendance.objects.select_related(
            "subject"
        ).filter(
            student=student
        )

        # -------------------------------------------------
        # Overall Attendance
        # -------------------------------------------------

        total_classes = attendance.count()

        present = attendance.filter(
            status="Present"
        ).count()

        absent = attendance.filter(
            status="Absent"
        ).count()

        percentage = get_attendance_percentage(
            present,
            total_classes
        )

        overall_status = get_attendance_status(
            percentage
        )

        # -------------------------------------------------
        # Subject-wise Attendance
        # -------------------------------------------------

        subject_ids = attendance.values_list(
            "subject_id",
            flat=True
        ).distinct()

        subject_data = []

        for subject_id in subject_ids:

            subject = Subject.objects.filter(
                id=subject_id
            ).first()

            subject_attendance = attendance.filter(
                subject_id=subject_id
            )

            subject_total = subject_attendance.count()

            subject_present = subject_attendance.filter(
                status="Present"
            ).count()

            subject_absent = subject_attendance.filter(
                status="Absent"
            ).count()

            subject_percentage = get_attendance_percentage(
                subject_present,
                subject_total
            )

            subject_status = get_attendance_status(
                subject_percentage
            )

            subject_data.append(
                {
                    "subject_id": subject_id,

                    "subject_code": (
                        subject.subject_code
                        if subject
                        else None
                    ),

                    "subject_name": (
                        subject.name
                        if subject
                        else None
                    ),

                    "total_classes": subject_total,

                    "present": subject_present,

                    "absent": subject_absent,

                    "attendance_percentage":
                        subject_percentage,

                    "status": subject_status
                }
            )

        # -------------------------------------------------
        # Final Dashboard Response
        # -------------------------------------------------

        return Response(
            {
                "student": {
                    "id": student.id,
                    "name": student.name
                },

                "overall": {
                    "total_classes": total_classes,

                    "present": present,

                    "absent": absent,

                    "attendance_percentage": percentage,

                    "status": overall_status
                },

                "subjects": subject_data
            }
        )


# =========================================================
# 5. Student Attendance Shortage
# =========================================================

class StudentAttendanceShortageView(APIView):

    permission_classes = [IsAuthenticated]

    # GET /attendance/student/<student_id>/shortage/

    def get(self, request, student_id):

        student = get_object_or_404(
            Student,
            id=student_id
        )

        attendance = Attendance.objects.filter(
            student=student
        )

        total_classes = attendance.count()

        present = attendance.filter(
            status="Present"
        ).count()

        absent = attendance.filter(
            status="Absent"
        ).count()

        # -------------------------------------------------
        # Required Attendance
        # -------------------------------------------------

        required_percentage = 75.0

        current_percentage = get_attendance_percentage(
            present,
            total_classes
        )

        # -------------------------------------------------
        # Classes Needed to Reach 75%
        # -------------------------------------------------

        classes_needed = 0

        if total_classes > 0:

            while (
                (present + classes_needed)
                /
                (total_classes + classes_needed)
                * 100
                < required_percentage
            ):

                classes_needed += 1

        elif total_classes == 0:

            classes_needed = 0

        # -------------------------------------------------
        # Classes That Can Be Missed
        # -------------------------------------------------

        classes_can_miss = 0

        if current_percentage >= required_percentage:

            while (
                present
                /
                (
                    total_classes
                    +
                    classes_can_miss
                    +
                    1
                )
                * 100
                >= required_percentage
            ):

                classes_can_miss += 1

        # -------------------------------------------------
        # Status
        # -------------------------------------------------

        if total_classes == 0:

            shortage_status = "NO ATTENDANCE DATA"

        elif current_percentage >= required_percentage:

            shortage_status = "SAFE"

        else:

            shortage_status = "SHORTAGE"

        # -------------------------------------------------
        # Response
        # -------------------------------------------------

        return Response(
            {
                "student_id": student.id,

                "student_name": student.name,

                "total_classes": total_classes,

                "present": present,

                "absent": absent,

                "current_attendance":
                    current_percentage,

                "required_attendance":
                    required_percentage,

                "status":
                    shortage_status,

                "classes_needed":
                    classes_needed,

                "classes_can_miss":
                    classes_can_miss
            }
        )
        
# =========================================================
# 6. Attendance Analytics
# =========================================================

class AttendanceAnalyticsView(APIView):

    permission_classes = [IsAuthenticated]

    # GET /attendance/analytics/
    def get(self, request):

        # -------------------------------------------------
        # All attendance records
        # -------------------------------------------------

        attendance = Attendance.objects.all()

        # -------------------------------------------------
        # Overall Summary
        # -------------------------------------------------

        total_attendance_records = attendance.count()

        present_records = attendance.filter(
            status="Present"
        ).count()

        absent_records = attendance.filter(
            status="Absent"
        ).count()

        if total_attendance_records > 0:
            overall_percentage = round(
                (present_records / total_attendance_records) * 100,
                2
            )
        else:
            overall_percentage = 0.0

        # -------------------------------------------------
        # Student Analytics
        # -------------------------------------------------

        students = Student.objects.all()

        student_data = []

        safe_students = 0
        warning_students = 0
        critical_students = 0

        for student in students:

            student_attendance = attendance.filter(
                student=student
            )

            total_classes = student_attendance.count()

            present_classes = student_attendance.filter(
                status="Present"
            ).count()

            absent_classes = student_attendance.filter(
                status="Absent"
            ).count()

            if total_classes > 0:

                percentage = round(
                    (present_classes / total_classes) * 100,
                    2
                )

            else:

                percentage = 0.0

            # Attendance status
            if total_classes == 0:
                attendance_status = "No Data"

            elif percentage >= 75:
                attendance_status = "Safe"
                safe_students += 1

            elif percentage >= 65:
                attendance_status = "Warning"
                warning_students += 1

            else:
                attendance_status = "Critical"
                critical_students += 1

            student_data.append(
                {
                    "student_id": student.id,
                    "student_name": student.name,
                    "usn": student.usn,
                    "total_classes": total_classes,
                    "present_classes": present_classes,
                    "absent_classes": absent_classes,
                    "attendance_percentage": percentage,
                    "status": attendance_status
                }
            )

        # -------------------------------------------------
        # Subject Analytics
        # -------------------------------------------------

        subjects = Subject.objects.all()

        subject_data = []

        for subject in subjects:

            subject_attendance = attendance.filter(
                subject=subject
            )

            total_classes = subject_attendance.count()

            present_classes = subject_attendance.filter(
                status="Present"
            ).count()

            absent_classes = subject_attendance.filter(
                status="Absent"
            ).count()

            if total_classes > 0:

                percentage = round(
                    (present_classes / total_classes) * 100,
                    2
                )

            else:

                percentage = 0.0

            if total_classes == 0:

                attendance_status = "No Data"

            elif percentage >= 75:

                attendance_status = "Safe"

            elif percentage >= 65:

                attendance_status = "Warning"

            else:

                attendance_status = "Critical"

            subject_data.append(
                {
                    "subject_id": subject.id,
                    "subject_name": subject.name,
                    "subject_code": subject.subject_code,
                    "total_classes": total_classes,
                    "present_classes": present_classes,
                    "absent_classes": absent_classes,
                    "attendance_percentage": percentage,
                    "status": attendance_status
                }
            )

        # -------------------------------------------------
        # Final Response
        # -------------------------------------------------

        return Response(
            {
                "summary": {
                    "total_attendance_records":
                        total_attendance_records,

                    "present_records":
                        present_records,

                    "absent_records":
                        absent_records,

                    "overall_attendance_percentage":
                        overall_percentage,

                    "total_students":
                        students.count(),

                    "safe_students":
                        safe_students,

                    "warning_students":
                        warning_students,

                    "critical_students":
                        critical_students
                },

                "students": student_data,

                "subjects": subject_data
            }
        )
        
# =========================================================
# 7. Admin Attendance Dashboard
# =========================================================

class AttendanceAdminDashboardView(APIView):

    permission_classes = [IsAuthenticated]

    # GET /attendance/admin/dashboard/
    def get(self, request):

        # -------------------------------------------------
        # ADMIN SECURITY CHECK
        # -------------------------------------------------

        if getattr(request.user, "role", None) != "ADMIN":
            return Response(
                {
                    "detail": "Admin access required."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # -------------------------------------------------
        # Import all required data
        # -------------------------------------------------

        students = Student.objects.all()
        subjects = Subject.objects.all()
        attendance = Attendance.objects.all()

        # Faculty count
        total_faculty = Faculty.objects.count()

        # -------------------------------------------------
        # Overall Attendance
        # -------------------------------------------------

        total_records = attendance.count()

        present_records = attendance.filter(
            status="Present"
        ).count()

        absent_records = attendance.filter(
            status="Absent"
        ).count()

        if total_records > 0:

            overall_percentage = round(
                (present_records / total_records) * 100,
                2
            )

        else:

            overall_percentage = 0.0

        # -------------------------------------------------
        # Student Status Counters
        # -------------------------------------------------

        safe_students = 0
        warning_students = 0
        critical_students = 0
        no_data_students = 0

        # -------------------------------------------------
        # Student Analytics
        # -------------------------------------------------

        student_data = []

        for student in students:

            student_attendance = attendance.filter(
                student=student
            )

            total_classes = student_attendance.count()

            present = student_attendance.filter(
                status="Present"
            ).count()

            absent = student_attendance.filter(
                status="Absent"
            ).count()

            if total_classes > 0:

                percentage = round(
                    (present / total_classes) * 100,
                    2
                )

            else:

                percentage = 0.0

            # -------------------------------------------------
            # Attendance Status
            # -------------------------------------------------

            if total_classes == 0:

                attendance_status = "No Data"
                no_data_students += 1

            elif percentage >= 75:

                attendance_status = "Safe"
                safe_students += 1

            elif percentage >= 65:

                attendance_status = "Warning"
                warning_students += 1

            else:

                attendance_status = "Critical"
                critical_students += 1

            student_data.append(
                {
                    "student_id": student.id,
                    "student_name": student.name,
                    "usn": student.usn,
                    "total_classes": total_classes,
                    "present_classes": present,
                    "absent_classes": absent,
                    "attendance_percentage": percentage,
                    "status": attendance_status
                }
            )

        # -------------------------------------------------
        # Subject Analytics
        # -------------------------------------------------

        subject_data = []

        for subject in subjects:

            subject_attendance = attendance.filter(
                subject=subject
            )

            total_classes = subject_attendance.count()

            present = subject_attendance.filter(
                status="Present"
            ).count()

            absent = subject_attendance.filter(
                status="Absent"
            ).count()

            if total_classes > 0:

                percentage = round(
                    (present / total_classes) * 100,
                    2
                )

            else:

                percentage = 0.0

            # -------------------------------------------------
            # Subject Status
            # -------------------------------------------------

            if total_classes == 0:

                attendance_status = "No Data"

            elif percentage >= 75:

                attendance_status = "Safe"

            elif percentage >= 65:

                attendance_status = "Warning"

            else:

                attendance_status = "Critical"

            subject_data.append(
                {
                    "subject_id": subject.id,
                    "subject_name": subject.name,
                    "subject_code": subject.subject_code,
                    "total_classes": total_classes,
                    "present_classes": present,
                    "absent_classes": absent,
                    "attendance_percentage": percentage,
                    "status": attendance_status
                }
            )

        # -------------------------------------------------
        # Students With Attendance Shortage
        # -------------------------------------------------

        shortage_students = []

        for student in students:

            student_attendance = attendance.filter(
                student=student
            )

            total_classes = student_attendance.count()

            present = student_attendance.filter(
                status="Present"
            ).count()

            absent = student_attendance.filter(
                status="Absent"
            ).count()

            # No attendance data
            if total_classes == 0:
                continue

            percentage = round(
                (present / total_classes) * 100,
                2
            )

            # -------------------------------------------------
            # Attendance Shortage
            # -------------------------------------------------

            if percentage < 75:

                classes_needed = 0

                while (
                    (
                        (present + classes_needed)
                        /
                        (total_classes + classes_needed)
                    ) * 100
                    < 75
                ):

                    classes_needed += 1

                shortage_students.append(
                    {
                        "student_id": student.id,
                        "student_name": student.name,
                        "usn": student.usn,
                        "total_classes": total_classes,
                        "present": present,
                        "absent": absent,
                        "attendance_percentage": percentage,
                        "classes_needed": classes_needed,
                        "status": "SHORTAGE"
                    }
                )

        # -------------------------------------------------
        # Sort Shortage Students
        # Lowest Attendance First
        # -------------------------------------------------

        shortage_students.sort(
            key=lambda student:
                student["attendance_percentage"]
        )

        # -------------------------------------------------
        # Final Admin Dashboard Response
        # -------------------------------------------------

        return Response(
            {
                "summary": {

                    "total_students":
                        students.count(),

                    "total_faculty":
                        total_faculty,

                    "total_subjects":
                        subjects.count(),

                    "total_attendance_records":
                        total_records,

                    "present_records":
                        present_records,

                    "absent_records":
                        absent_records,

                    "overall_attendance_percentage":
                        overall_percentage,

                    "safe_students":
                        safe_students,

                    "warning_students":
                        warning_students,

                    "critical_students":
                        critical_students,

                    "no_data_students":
                        no_data_students
                },

                "students":
                    student_data,

                "subjects":
                    subject_data,

                "shortage_students":
                    shortage_students
            }
        )