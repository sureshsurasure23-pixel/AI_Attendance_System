from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import (
    MyProfileView,
    StudentOnlyView,
)


urlpatterns = [

    # =====================================================
    # JWT LOGIN
    # =====================================================

    path(
        "token/",
        TokenObtainPairView.as_view(),
        name="token_obtain_pair",
    ),

    # =====================================================
    # JWT TOKEN REFRESH
    # =====================================================

    path(
        "token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),

    # =====================================================
    # USER PROFILE
    # =====================================================

    path(
        "profile/",
        MyProfileView.as_view(),
        name="my-profile",
    ),

    # =====================================================
    # STUDENT ONLY
    # =====================================================

    path(
        "student-only/",
        StudentOnlyView.as_view(),
        name="student-only",
    ),

]