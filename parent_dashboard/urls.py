from django.urls import path
from .views import ParentDashboard

urlpatterns = [
    path("<int:student_id>/", ParentDashboard.as_view(), name="parent-dashboard"),
]