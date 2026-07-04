#!/bin/bash
set -e

PROJECT_ID="stackapps-dcab1"
SERVICE_NAME="stackapps-mcp"
REGION="us-central1"

# Cloud Run serves blueprint discovery only (discovery_only=True in http_main.py).
# NEVER set WALLET_PRIVATE_KEY on this service — a funded wallet on a public
# endpoint would be a drain vector.

echo "Building and deploying $SERVICE_NAME to Cloud Run..."

cd "$(dirname "$0")/stackapps-mcp"
gcloud builds submit --tag "gcr.io/$PROJECT_ID/$SERVICE_NAME" --project "$PROJECT_ID"

gcloud run deploy "$SERVICE_NAME" \
  --image "gcr.io/$PROJECT_ID/$SERVICE_NAME" \
  --platform managed \
  --region "$REGION" \
  --project "$PROJECT_ID" \
  --allow-unauthenticated \
  --timeout=3600 \
  --min-instances=0 \
  --max-instances=10

echo "Deploy complete."
