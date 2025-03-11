# Pobieramy oficjalny obraz Python
FROM python:3.9-slim

# Ustalamy katalog roboczy
WORKDIR /app

# Kopiujemy wymagane pliki
COPY requirements.txt /app/

# Instalujemy zależności
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Kopiujemy resztę aplikacji
COPY . /backend/

# Ustawiamy zmienną środowiskową dla Django
ENV PYTHONUNBUFFERED 1

# Otwieramy port
EXPOSE 8000

# Komenda uruchamiająca serwer Django
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]