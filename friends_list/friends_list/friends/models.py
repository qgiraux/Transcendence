from django.db import models

# Create your models here.
class Friends(models.Model):
    user_id = models.IntegerField()
    friend_id = models.IntegerField()