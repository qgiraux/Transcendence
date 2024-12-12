from django.db import models
from django.core.validators import RegexValidator
from django.contrib.postgres.fields import ArrayField

# Create your models here.
class Tournament(models.Model):
    tournament_name = models.CharField(
        max_length=32,
        validators=[
            RegexValidator(
                regex=r'^[a-zA-Z0-9]*$',  # Alphanumeric pattern
                message='This field only accepts alphanumeric characters.',
                code='invalid_alnum'
            )
        ]
    )
    player_list = ArrayField(
        models.IntegerField(),
        default=list,  # Starts as an empty list
        blank=True
    )
