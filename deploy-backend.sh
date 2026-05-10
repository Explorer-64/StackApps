#!/bin/bash
set -e

PROJECT_ID="stackapps-dcab1"
SERVICE_NAME="stackapps-backend"
REGION="us-central1"

echo "Building and deploying $SERVICE_NAME to Cloud Run..."

gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME

gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --set-env-vars "SECRETS_BACKEND=gcp,GOOGLE_CLOUD_PROJECT=$PROJECT_ID,FIREBASE_STORAGE_BUCKET=stackapps-dcab1.firebasestorage.app" \
    --set-secrets "FIREBASE_SERVICE_ACCOUNT_KEY=stackapps-firebase-service-account:latest,ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest,GOOGLEAI_API_KEY=GOOGLEAI_API_KEY:latest,OPENROUTER_API_KEY=OPENROUTER_API_KEY:latest"

echo "Deploy complete."
