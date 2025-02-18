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
    account_deleted = models.BooleanField(default=False)
    lang = models.CharField(max_length=5, default="null")

def add_stat(self, tournament_id, date, opponent, score, win):
        """Add or update a tournament stat."""
        logger.debug("[users.models] starting add_stat")
        if not self.stats:
            self.stats = {}
            logger.debug("[users.models] stats created")
        else:
            logger.debug("[users.models] stats exists")
        self.stats[date] = {
            "date": date,
            "opponent": opponent,
            "score": score,
            "win": win,
        }
        logger.info("[users.models] stats updated")
        self.save()
