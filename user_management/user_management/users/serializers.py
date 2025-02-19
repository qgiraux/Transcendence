from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'nickname','account_deleted', 'lang')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            nickname=validated_data['nickname'],
            account_deleted=validated_data['account_deleted'],
            lang=validated_data['lang']
        )
        return user



class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def get_token(self, user):
        # Get the default token
        token = super().get_token(user)

        # Add custom fields
        token['username'] = user.username
        token['nickname'] = user.nickname

        # Add any other custom claims
        token['is_admin'] = user.is_staff

        return token

import re
class UsernameSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('username',)
    def validate_username(self, value):
        if len(value) < 5:
            raise serializers.ValidationError("Username must be at least 5 characters long.")
        if not re.match("^[a-zA-Z0-9_]+$", value):
            raise serializers.ValidationError("Username can only contain alphanumeric characters and underscores.")
        return value

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('username', 'password', 'nickname')

    def validate_username(self, value):
        if len(value) < 5:
            raise serializers.ValidationError("Username must be at least 5 characters long.")
        if not re.match("^[a-zA-Z0-9_]+$", value):
            raise serializers.ValidationError("Username can only contain alphanumeric characters and underscores.")
        return value

    def validate_password(self, value):
        if len(value) < 8 or len(value) > 20:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError("Password must contain at least one uppercase letter.")
        if not re.search(r'[a-z]', value):
            raise serializers.ValidationError("Password must contain at least one lowercase letter.")
        if not re.search(r'[0-9]', value):
            raise serializers.ValidationError("Password must contain at least one digit.")
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
            signs = r'!@#$%^&*(),.?":{}|<>'
            raise serializers.ValidationError(f"Password must contain at least one special character from {signs}.")
        return value
