FROM python

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    libpq-dev \ 
    && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /pong_game

# Upgrade pip and install project dependencies
COPY pong_game/requirements.txt ./
RUN pip install --upgrade pip \
    && pip install  -r requirements.txt

COPY ./pong_game/pong_game .
# Expose ports (8000 for Django, optional 6379 for Redis if applicable)
EXPOSE 8000 6379

# Command to start Django development server
CMD  ["python", "manage.py", "runserver", "0.0.0.0:8000"]
# CMD ["tail", "-f"]
