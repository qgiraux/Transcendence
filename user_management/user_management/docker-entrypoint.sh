#!/bin/bash
# Exit immediately if a command exits with a non-zero status
set -e
# sleep 5
# Apply database migrations
for i in {1..15}; do
    python manage.py makemigrations && break || sleep 1;
done
python manage.py migrate

# Run the server
python manage.py runserver 0.0.0.0:8000
