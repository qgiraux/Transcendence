# .devcontainer/Dockerfile
FROM python

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    libpq-dev \ 
    && rm -rf /var/lib/apt/lists/*

# Set up a working directory (used as mount target)
WORKDIR /workspace/user_management

# Install pipenv or pip if needed, based on your environment requirements
RUN pip install --upgrade pip

RUN pip install django-debug-toolbar
# Expose port 8000 for Django development server
EXPOSE 8000

# Keep the container running
CMD ["tail", "-f", "/dev/null"]
