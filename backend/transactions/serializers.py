# this file allows for front end (react) and django (backend)
# to interact by converting between json and python it connects to
# rest_framework because this is one stepping stone for how the 
# front end will use the API we create

from rest_framework import serializers
from .models import Transaction

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'
