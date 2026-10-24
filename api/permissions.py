from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):

    def has_permission(self, request, view):
        return request.user.is_staff


class IsFaculty(BasePermission):

    def has_permission(self, request, view):
        return (
            request.user.groups.filter(name="Faculty").exists()
            or request.user.is_staff
        )


class IsStudent(BasePermission):

    def has_permission(self, request, view):
        return (
            request.user.groups.filter(name="Student").exists()
            or request.user.is_staff
        )