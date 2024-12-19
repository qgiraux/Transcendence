# .devcontainer/Dockerfile
FROM python

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    libpq-dev \
    redis-server \
    && rm -rf /var/lib/apt/lists/*

# Set up a working directory (used as mount target)
WORKDIR /user_management

# Upgrade pip and install project dependencies
COPY user_management/requirements.txt ./
RUN pip install  --upgrade pip \
    && pip install  -r requirements.txt


COPY ./user_management/user_management .
RUN chmod 777 docker-entrypoint.sh


EXPOSE 8000

CMD ["./docker-entrypoint.sh"]

