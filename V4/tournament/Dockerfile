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
WORKDIR /tournament

# Upgrade pip and install project dependencies
COPY tournament/requirements.txt ./
RUN pip install  --upgrade pip \
    && pip install  -r requirements.txt


COPY ./tournament/tournament .
RUN chmod 777 docker-entrypoint.sh


EXPOSE 8000 6379

CMD ["./docker-entrypoint.sh"]

