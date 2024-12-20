# Create your models here.
from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    nickname = models.CharField(max_length=20, blank=True, null=True)
    twofa_enabled = models.BooleanField(default=False)

