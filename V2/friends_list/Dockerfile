FROM python

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    libpq-dev \ 
    && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /friends_list

# Upgrade pip and install project dependencies
COPY friends_list/requirements.txt ./
RUN pip install --upgrade pip \
    && pip install  -r requirements.txt

    COPY ./friends_list/friends_list .
    RUN chmod 777 docker-entrypoint.sh
# Expose ports (8000 for Django, optional 6379 for Redis if applicable)
EXPOSE 8000

# Command to start Django development server
CMD ["./docker-entrypoint.sh"]