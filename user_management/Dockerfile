# # .devcontainer/Dockerfile
# FROM python

# # Install system dependencies
# RUN apt-get update && apt-get install -y \
#     curl \
#     build-essential \
#     libpq-dev \ 
#     && rm -rf /var/lib/apt/lists/*


# # Install pipenv or pip if needed, based on your environment requirements
# RUN pip install --upgrade pip

# RUN pip install django-debug-toolbar
# # Expose port 8000 for Django development server
# EXPOSE 8000

# COPY user_management /app

# # Keep the container running
# CMD ["python","/user_management/manage.py", "runserver"]

# Use a specific Python version
FROM python:3.11

# Set working directory in the container
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip
RUN pip install --upgrade pip

# Copy application requirements
# COPY user_management/requirements.txt /app/

# Install Python dependencies
RUN pip install django \
    djangorestframework \
    djangorestframework-simplejwt \
    psycopg2-binary 

# Copy the entire application code
COPY user_management /app
COPY docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

# Expose port 8000 for Django development server
EXPOSE 8000

# Command to run the Django development server
ENTRYPOINT ["/app/docker-entrypoint.sh"]
