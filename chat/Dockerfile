FROM python

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    libpq-dev \
    redis-server \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /chat

# Upgrade pip and install project dependencies
COPY chat/requirements.txt ./
RUN pip install --upgrade pip \
    && pip install  -r requirements.txt

COPY ./chat/chat .
RUN chmod 777 docker-entrypoint.sh

# Expose ports (8000 for Django, optional 6379 for Redis if applicable)
EXPOSE 8000 6379

# Command to start Django development server
CMD ["./docker-entrypoint.sh"]

