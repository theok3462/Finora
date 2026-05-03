# imports GET,POST,PUT,DELETE from viewsets from rest_framework
# logic handles specific request from front end to do one of the four above tasks

from rest_framework import viewsets
from .models import Transaction
from .serializers import TransactionSerializer

class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all().order_by('-date')
    serializer_class = TransactionSerializer