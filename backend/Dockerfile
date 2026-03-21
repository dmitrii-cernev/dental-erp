FROM python:3.12-slim
RUN apt-get update && apt-get install -y gcc curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY pyproject.toml .
RUN pip install --no-cache-dir .
COPY src/ src/
COPY alembic/ alembic/
COPY alembic.ini .
RUN mkdir -p /data
ENV DATABASE_URL=sqlite:////data/dental_erp.db
EXPOSE 8000
HEALTHCHECK CMD curl -f http://localhost:8000/health || exit 1
CMD ["sh", "-c", "alembic upgrade head && uvicorn dental_erp.main:app --host 0.0.0.0 --port 8000"]
