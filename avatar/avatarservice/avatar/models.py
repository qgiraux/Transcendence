import uuid
import os
from django.db import models

def upload_to_with_uuid(instance, filename):
    extension = filename.split('.')[-1]
    new_filename = f"{instance.uuid}.{extension}"
    return os.path.join('images/', new_filename)

class Avatar(models.Model):
    Userid = models.IntegerField(default=0)
    image = models.ImageField(upload_to=upload_to_with_uuid)
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    def __str__(self):
        return str(self.uuid)
