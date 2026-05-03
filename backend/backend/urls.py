# imports the admin panel url and tools for defining url patterns
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # django's built in admin panel
    path('admin/', admin.site.urls),
    
    # any request starting with api/ gets forwarded to transactions urls.py
    path('api/', include('transactions.urls')),
]