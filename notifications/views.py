from django.shortcuts import get_object_or_404

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import Notification
from .serializers import NotificationSerializer

from students.models import Student
from parent_dashboard.models import Parent


# =========================================================
# NOTIFICATION LIST + CREATE
# =========================================================

class NotificationListCreate(APIView):
    """
    Notification list and creation.

    ADMIN:
        GET  -> All notifications
        POST -> Create notification

    STUDENT:
        GET -> Own notifications only

    PARENT:
        GET -> Notifications of linked student

    POST:
        Only ADMIN can manually create notifications.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):

        # -----------------------------------------
        # ADMIN
        # -----------------------------------------
        if request.user.role == "ADMIN":

            notifications = (
                Notification.objects
                .select_related("student", "parent")
                .all()
                .order_by("-created_at")
            )

        # -----------------------------------------
        # STUDENT
        # -----------------------------------------
        elif request.user.role == "STUDENT":

            student = (
                Student.objects
                .filter(user=request.user)
                .first()
            )

            if not student:
                return Response(
                    {
                        "message": "Student profile not found."
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

            notifications = (
                Notification.objects
                .filter(student=student)
                .select_related("student", "parent")
                .order_by("-created_at")
            )

        # -----------------------------------------
        # PARENT
        # -----------------------------------------
        elif request.user.role == "PARENT":

            parent = (
                Parent.objects
                .select_related("student")
                .filter(user=request.user)
                .first()
            )

            if not parent:
                return Response(
                    {
                        "message": "Parent profile not found."
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

            notifications = (
                Notification.objects
                .filter(student=parent.student)
                .select_related("student", "parent")
                .order_by("-created_at")
            )

        # -----------------------------------------
        # OTHER ROLES
        # -----------------------------------------
        else:

            return Response(
                {
                    "message":
                    "You are not authorized to view notifications."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = NotificationSerializer(
            notifications,
            many=True
        )

        return Response(serializer.data)

    def post(self, request):

        # -----------------------------------------
        # ONLY ADMIN CAN CREATE
        # -----------------------------------------
        if request.user.role != "ADMIN":

            return Response(
                {
                    "message":
                    "Only admin can create notifications."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = NotificationSerializer(
            data=request.data
        )

        if serializer.is_valid():

            serializer.save()

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


# =========================================================
# NOTIFICATION DETAIL / UPDATE / DELETE
# =========================================================

class NotificationDetailUpdateDelete(APIView):
    """
    GET:
        ADMIN   -> Any notification
        STUDENT -> Own notification
        PARENT  -> Notification of linked student

    PUT:
        ADMIN   -> Update notification
        STUDENT -> Update only is_read
        PARENT  -> Update only is_read

    DELETE:
        ADMIN only
    """

    permission_classes = [IsAuthenticated]

    def get_notification(self, request, id):

        notification = get_object_or_404(
            Notification.objects.select_related(
                "student",
                "parent"
            ),
            id=id
        )

        # -----------------------------------------
        # ADMIN
        # -----------------------------------------
        if request.user.role == "ADMIN":

            return notification, None

        # -----------------------------------------
        # STUDENT
        # -----------------------------------------
        if request.user.role == "STUDENT":

            student = (
                Student.objects
                .filter(user=request.user)
                .first()
            )

            if not student:

                return None, Response(
                    {
                        "message":
                        "Student profile not found."
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

            if notification.student_id != student.id:

                return None, Response(
                    {
                        "message":
                        "You are not authorized to access this notification."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            return notification, None

        # -----------------------------------------
        # PARENT
        # -----------------------------------------
        if request.user.role == "PARENT":

            parent = (
                Parent.objects
                .select_related("student")
                .filter(user=request.user)
                .first()
            )

            if not parent:

                return None, Response(
                    {
                        "message":
                        "Parent profile not found."
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

            if notification.student_id != parent.student_id:

                return None, Response(
                    {
                        "message":
                        "You are not authorized to access this notification."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            return notification, None

        # -----------------------------------------
        # OTHER ROLES
        # -----------------------------------------

        return None, Response(
            {
                "message": "You are not authorized."
            },
            status=status.HTTP_403_FORBIDDEN
        )

    # -----------------------------------------
    # GET ONE NOTIFICATION
    # -----------------------------------------

    def get(self, request, id):

        notification, error = self.get_notification(
            request,
            id
        )

        if error:
            return error

        serializer = NotificationSerializer(
            notification
        )

        return Response(
            serializer.data
        )

    # -----------------------------------------
    # UPDATE NOTIFICATION
    # -----------------------------------------

    def put(self, request, id):

        notification, error = self.get_notification(
            request,
            id
        )

        if error:
            return error

        # -----------------------------------------
        # STUDENT / PARENT
        # -----------------------------------------

        if request.user.role in ["STUDENT", "PARENT"]:

            if "is_read" not in request.data:

                return Response(
                    {
                        "message":
                        "You can only update is_read."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            notification.is_read = request.data["is_read"]

            notification.save(
                update_fields=["is_read"]
            )

            serializer = NotificationSerializer(
                notification
            )

            return Response(
                {
                    "message":
                    "Notification status updated successfully.",
                    "data":
                    serializer.data
                }
            )

        # -----------------------------------------
        # ADMIN
        # -----------------------------------------

        serializer = NotificationSerializer(
            notification,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():

            serializer.save()

            return Response(
                {
                    "message":
                    "Notification updated successfully.",
                    "data":
                    serializer.data
                }
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    # -----------------------------------------
    # DELETE NOTIFICATION
    # -----------------------------------------

    def delete(self, request, id):

        if request.user.role != "ADMIN":

            return Response(
                {
                    "message":
                    "Only admin can delete notifications."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        notification = get_object_or_404(
            Notification,
            id=id
        )

        notification.delete()

        return Response(
            {
                "message":
                "Notification deleted successfully."
            },
            status=status.HTTP_200_OK
        )


# =========================================================
# STUDENT NOTIFICATIONS
# =========================================================

class StudentNotifications(APIView):
    """
    Student-specific notifications.

    URL uses the Student Code.

    Example:
        /notifications/student/STU001/

    ADMIN:
        Can view any student's notifications.

    STUDENT:
        Can view only their own notifications.

    PARENT:
        Can view only their linked student's notifications.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):

        # =================================================
        # ADMIN
        # =================================================

        if request.user.role == "ADMIN":

            student = get_object_or_404(
                Student,
                student_id=student_id
            )

        # =================================================
        # STUDENT
        # =================================================

        elif request.user.role == "STUDENT":

            student = (
                Student.objects
                .filter(user=request.user)
                .first()
            )

            if not student:

                return Response(
                    {
                        "message":
                        "Student profile not found."
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

            # Check Student Code
            if student.student_id != student_id:

                return Response(
                    {
                        "message":
                        "You are not authorized to view this student's notifications."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # =================================================
        # PARENT
        # =================================================

        elif request.user.role == "PARENT":

            parent = (
                Parent.objects
                .select_related("student")
                .filter(user=request.user)
                .first()
            )

            if not parent:

                return Response(
                    {
                        "message":
                        "Parent profile not found."
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

            student = parent.student

            if student.student_id != student_id:

                return Response(
                    {
                        "message":
                        "You are not authorized to view this student's notifications."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # =================================================
        # OTHER ROLES
        # =================================================

        else:

            return Response(
                {
                    "message":
                    "You are not authorized."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # =================================================
        # GET NOTIFICATIONS
        # =================================================

        notifications = (
            Notification.objects
            .filter(student=student)
            .select_related(
                "student",
                "parent"
            )
            .order_by("-created_at")
        )

        serializer = NotificationSerializer(
            notifications,
            many=True
        )

        return Response(
            serializer.data
        )


# =========================================================
# MARK NOTIFICATION AS READ
# =========================================================

class MarkNotificationRead(APIView):
    """
    Mark one notification as read.

    ADMIN:
        Can mark any notification.

    STUDENT:
        Can mark own notification.

    PARENT:
        Can mark linked student's notification.
    """

    permission_classes = [IsAuthenticated]

    def patch(self, request, id):

        notification = get_object_or_404(
            Notification,
            id=id
        )

        # =================================================
        # STUDENT
        # =================================================

        if request.user.role == "STUDENT":

            student = (
                Student.objects
                .filter(user=request.user)
                .first()
            )

            if not student:

                return Response(
                    {
                        "message":
                        "Student profile not found."
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

            if notification.student_id != student.id:

                return Response(
                    {
                        "message":
                        "You are not authorized."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # =================================================
        # PARENT
        # =================================================

        elif request.user.role == "PARENT":

            parent = (
                Parent.objects
                .select_related("student")
                .filter(user=request.user)
                .first()
            )

            if not parent:

                return Response(
                    {
                        "message":
                        "Parent profile not found."
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

            if notification.student_id != parent.student_id:

                return Response(
                    {
                        "message":
                        "You are not authorized."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

        # =================================================
        # ADMIN
        # =================================================

        elif request.user.role == "ADMIN":

            pass

        # =================================================
        # OTHER ROLES
        # =================================================

        else:

            return Response(
                {
                    "message":
                    "You are not authorized."
                },
                status=status.HTTP_403_FORBIDDEN
            )

        # =================================================
        # MARK AS READ
        # =================================================

        notification.is_read = True

        notification.save(
            update_fields=["is_read"]
        )

        return Response(
            {
                "message":
                "Notification marked as read.",
                "id":
                notification.id,
                "is_read":
                notification.is_read
            },
            status=status.HTTP_200_OK
        )