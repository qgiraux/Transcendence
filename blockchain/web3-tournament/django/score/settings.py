import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('W3T_SECRET_KEY', '')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

ALLOWED_HOSTS = [
    'tournament',
    '.localhost',
    '127.0.0.1',
    ]


# Application definition

INSTALLED_APPS = [
	"daphne",
	'adrf',
    'django.contrib.auth',
    'django.contrib.contenttypes',
	'rest_framework',
]

REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ]
}

MIDDLEWARE = []

ROOT_URLCONF = 'score.urls'

TEMPLATES = []

ASGI_APPLICATION = 'score.asgi.application'

DATABASES = {
	"default": {
		"ENGINE": "django.db.backends.sqlite3", #used in testing only
	}
}

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Europe/Paris'

USE_I18N = True

USE_TZ = True
