from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from django.shortcuts import get_object_or_404

from allocations.models import FacultySubject
from attendance.models import Attendance
from students.models import Student
from sessions_app.models import AttendanceSession
from subjects.models import Subject
from notifications.models import Notification

from .serializers import FacultySubjectSerializer


# =====================================================
# Faculty Subject List
# =====================================================

class FacultySubjectList(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = FacultySubject.objects.all()
    serializer_class = FacultySubjectSerializer


# =====================================================
# Faculty Dashboard
# =====================================================

class FacultyDashboard(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, faculty_id):

        allocations = FacultySubject.objects.filter(
            faculty_id=faculty_id
        )

        data = []

        for allocation in allocations:

            data.append({
                "subject": allocation.subject.subject_name,
                "subject_code": allocation.subject.subject_code,
                "department": allocation.department.name,
                "semester": allocation.semester.semester_number,
                "section": allocation.section.name,
                "academic_year": allocation.academic_year,
            })

        return Response(data)


# =====================================================
# Session Students
# =====================================================

class SessionStudents(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):

        session = get_object_or_404(
            AttendanceSession,
            id=session_id
        )

        students = Student.objects.filter(
            department=session.subject.department,
            semester=session.semester.semester_number,
            section=session.section.name,
        )

        data = []

        for student in students:

            data.append({
                "id": student.id,
                "student_id": student.student_id,
                "usn": student.usn,
                "name": student.name,
            })

        return Response(data)


# =====================================================
# Mark Attendance
# =====================================================

class MarkAttendance(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        session = get_object_or_404(
            AttendanceSession,
            id=request.data["session"]
        )

        student = get_object_or_404(
            Student,
            id=request.data["student"]
        )

        Attendance.objects.update_or_create(
            session=session,
            student=student,
            subject=session.subject,
            faculty=session.faculty,
            attendance_date=session.attendance_date,
            defaults={
                "status": request.data["status"]
            }
        )

        total = Attendance.objects.filter(
            student=student
        ).count()

        present = Attendance.objects.filter(
            student=student,
            status="Present"
        ).count()

        percentage = 0

        if total > 0:
            percentage = round(
                (present / total) * 100,
                2
            )

        if percentage < 75:

            Notification.objects.get_or_create(
                student=student,
                title="Attendance Warning",
                message=f"Your attendance is {percentage}%. Please improve your attendance."
            )

        return Response({
            "message": "Attendance Saved",
            "attendance_percentage": percentage
        })


# =====================================================
# Session Attendance
# =====================================================

class SessionAttendance(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):

        attendance = Attendance.objects.filter(
            session_id=session_id
        )

        data = []

        for record in attendance:

            data.append({
                "student_id": record.student.student_id,
                "usn": record.student.usn,
                "name": record.student.name,
                "subject": record.subject.subject_name,
                "status": record.status,
                "date": record.attendance_date,
            })

        return Response(data)


# =====================================================
# Student Attendance Report
# =====================================================

class StudentAttendanceReport(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):

        student = get_object_or_404(
            Student,
            id=student_id
        )

        total = Attendance.objects.filter(
            student=student
        ).count()

        present = Attendance.objects.filter(
            student=student,
            status="Present"
        ).count()

        absent = Attendance.objects.filter(
            student=student,
            status="Absent"
        ).count()

        percentage = 0

        if total > 0:
            percentage = round(
                (present / total) * 100,
                2
            )

        return Response({
            "student": student.name,
            "student_id": student.student_id,
            "usn": student.usn,
            "total_classes": total,
            "present": present,
            "absent": absent,
            "percentage": percentage,
        })


# =====================================================
# Session Summary
# =====================================================

class SessionSummary(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):

        session = get_object_or_404(
            AttendanceSession,
            id=session_id
        )

        total_students = Student.objects.filter(
            department=session.subject.department,
            semester=session.semester.semester_number,
            section=session.section.name,
        ).count()

        present = Attendance.objects.filter(
            session=session,
            status="Present"
        ).count()

        absent = Attendance.objects.filter(
            session=session,
            status="Absent"
        ).count()

        percentage = 0

        if total_students > 0:
            percentage = round(
                (present / total_students) * 100,
                2
            )

        return Response({
            "session": session.id,
            "subject": session.subject.subject_name,
            "date": session.attendance_date,
            "total_students": total_students,
            "present": present,
            "absent": absent,
            "attendance_percentage": percentage,
        })


# =====================================================
# Student Dashboard
# =====================================================

class StudentDashboard(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):

        student = get_object_or_404(
            Student,
            id=student_id
        )

        attendance = Attendance.objects.filter(
            student=student
        )

        total = attendance.count()
        present = attendance.filter(status="Present").count()
        absent = attendance.filter(status="Absent").count()

        percentage = 0

        if total > 0:
            percentage = round(
                (present / total) * 100,
                2
            )

        subjects = []

        for subject in Subject.objects.filter(
            department=student.department,
            semester=student.semester
        ):

            records = attendance.filter(
                subject=subject
            )

            total_subject = records.count()

            present_subject = records.filter(
                status="Present"
            ).count()

            subject_percentage = 0

            if total_subject > 0:
                subject_percentage = round(
                    (present_subject / total_subject) * 100,
                    2
                )

            subjects.append({
                "subject": subject.subject_name,
                "percentage": subject_percentage
            })

        return Response({

            "student": student.name,
            "student_id": student.student_id,
            "usn": student.usn,
            "department": student.department.name,
            "semester": student.semester,
            "section": student.section,

            "attendance": {
                "total_classes": total,
                "present": present,
                "absent": absent,
                "percentage": percentage,
            },

            "subjects": subjects

        })


# =====================================================
# Attendance Shortage
# =====================================================

class AttendanceShortage(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        data = []

        students = Student.objects.all()

        for student in students:

            total = Attendance.objects.filter(
                student=student
            ).count()

            present = Attendance.objects.filter(
                student=student,
                status="Present"
            ).count()

            percentage = 0

            if total > 0:
                percentage = round(
                    (present / total) * 100,
                    2
                )

            if percentage < 75:

                data.append({
                    "student": student.name,
                    "student_id": student.student_id,
                    "usn": student.usn,
                    "attendance_percentage": percentage,
                    "status": "Shortage",
                })

        return Response(data)