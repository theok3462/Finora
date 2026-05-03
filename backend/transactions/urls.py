# tools for defining URL patterns and including other url files
from django.urls import path, include

# automatically creates standard API routes (GET, POST, DELETE, etc.)
from rest_framework.routers import DefaultRouter

# the logic that handles what happens when each route is hit
from .views import TransactionViewSet

# create the router that will auto-generate our API URLs
router = DefaultRouter()

# register our transactions viewset — router will create all the endpoints
router.register(r'transactions', TransactionViewSet)

# expose the router's generated URLs to Django
urlpatterns = [
    path('', include(router.urls)),
]