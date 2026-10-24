from django.urls import path,include
from .views import PredictionHome

urlpatterns = [
    path("", PredictionHome.as_view()),
    path(
    "chatbot/",
    include("chatbot.urls"),
),
]