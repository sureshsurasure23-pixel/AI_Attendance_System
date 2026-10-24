from django.urls import path
from .views import StudentChatbot

urlpatterns = [
    path("student/", StudentChatbot.as_view(), name="student-chatbot"),
]