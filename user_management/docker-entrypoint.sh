#!/bin/bash
# Exit immediately if a command exits with a non-zero status
set -e

# Apply database migrations
python manage.py makemigrations
python manage.py migrate

# Run the server
python manage.py runserver 0.0.0.0:8000
