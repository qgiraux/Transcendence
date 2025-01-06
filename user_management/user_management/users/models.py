# Create your models here.
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models
import logging

logger = logging.getLogger(__name__)

class CustomUser(AbstractUser):
    nickname = models.CharField(max_length=20, blank=True, null=True)
    twofa_enabled = models.BooleanField(default=False)
    stats = models.JSONField(default=dict)

def add_stat(self, tournament_id, date, opponent, score, win):
        """Add or update a tournament stat."""
        logger.error("starting add_stat")
        if not self.stats:
            self.stats = {}
            logger.error("stats created")
        logger.error("stats exists")
        self.stats[tournament_id] = {
            "date": date,
            "opponent": opponent,
            "score": score,
            "win": win,
        }
        logger.error("stats updated")
        self.save()