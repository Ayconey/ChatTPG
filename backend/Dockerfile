FROM python:3.11-slim

# ---- system deps -----------------------------------------------------------
RUN apt-get update && apt-get install -y \
    build-essential \
    default-libmysqlclient-dev \
    gcc \
    pkg-config \
  && rm -rf /var/lib/apt/lists/*

# ---- runtime env -----------------------------------------------------------
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=config.settings \
    PORT=80

# ---- project ..., App directory
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 80

# ---- run --------------------------------------------------
CMD python manage.py migrate && \
    daphne --proxy-headers -b 0.0.0.0 -p 80 config.asgi:application