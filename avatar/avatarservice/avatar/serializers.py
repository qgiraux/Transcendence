from rest_framework import serializers
from .models import Avatar

class AvatarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Avatar
        fields = '__all__'

class AvatarListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Avatar
        fields = ['Userid', 'uuid']
