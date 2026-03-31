FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY ml/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY ml/ ./ml/

ENV PYTHONPATH=/app
ENV MODEL_PATH=/app/ml/checkpoints/best_model.pt
ENV PORT=8000

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "ml.inference.app:app", "--host", "0.0.0.0", "--port", "8000"]
