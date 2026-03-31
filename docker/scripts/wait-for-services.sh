#!/usr/bin/env sh
set -eu

echo "Waiting for ML service..."
until curl -fsS "http://localhost:8000/health" >/dev/null; do
  sleep 2
done

echo "Waiting for backend service..."
until curl -fsS "http://localhost:5000/api/health" >/dev/null; do
  sleep 2
done

echo "Waiting for frontend service..."
until curl -fsS "http://localhost:3000" >/dev/null; do
  sleep 2
done

echo "All services are ready."
