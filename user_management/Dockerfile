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

# Upgrade pip and install project dependencies
COPY user_management/requirements.txt ./
RUN pip install  --upgrade pip \
    && pip install  -r requirements.txt

COPY ./user_management .

EXPOSE 8001

# Keep the container running
CMD ["python", "user_management/manage.py", "runserver", "0.0.0.0:8001"]
