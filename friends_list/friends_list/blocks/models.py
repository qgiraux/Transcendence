from django.db import models

# Create your models here.
class Blocks(models.Model):
    user_id = models.IntegerField()
    block_id = models.IntegerField()