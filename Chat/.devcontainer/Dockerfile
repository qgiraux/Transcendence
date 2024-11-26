# .devcontainer/Dockerfile
FROM python

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    libpq-dev \ 
    # redis-server\
    && rm -rf /var/lib/apt/lists/*

# Set up a working directory (used as mount target)
WORKDIR /workspace/tournament

# Install pipenv or pip if needed, based on your environment requirements
RUN pip install --upgrade pip

RUN pip install django-debug-toolbar
# Expose port 8000 for Django development server
EXPOSE 8000 6379

# Keep the container running
CMD tail -f /dev/null #service redis-server start && tail -f /dev/null
