from django.urls import path

from .views import (
    FeeListCreate,
    FeeDetailUpdateDelete,
    StudentFees,
)


urlpatterns = [

    path(
        "list/",
        FeeListCreate.as_view(),
        name="fees-list-create"
    ),

    path(
        "detail/<int:id>/",
        FeeDetailUpdateDelete.as_view(),
        name="fees-detail"
    ),

    path(
        "student/<int:student_id>/",
        StudentFees.as_view(),
        name="student-fees"
    ),

]