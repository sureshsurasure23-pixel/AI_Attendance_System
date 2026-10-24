from django.urls import path

from .views import (
    SubjectListCreate,
    SubjectDetailUpdateDelete,
)


urlpatterns = [

    path(
        "list/",
        SubjectListCreate.as_view(),
        name="subject-list-create"
    ),

    path(
        "detail/<int:id>/",
        SubjectDetailUpdateDelete.as_view(),
        name="subject-detail"
    ),
]