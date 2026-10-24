from django.urls import path

from .views import (
    MarkListCreate,
    MarkDetailUpdateDelete
)


urlpatterns = [

    path(
        "list/",
        MarkListCreate.as_view(),
        name="marks-list-create"
    ),

    path(
        "detail/<int:id>/",
        MarkDetailUpdateDelete.as_view(),
        name="marks-detail"
    ),

]