#!/bin/bash

# Exit script if any command fails
set -e

# Run from the repository root so relative paths resolve wherever the script is called from
cd "$(dirname "$0")/.."

# Load environment variables from .env file
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

echo "Pulling the latest changes for this repository..."

git pull

docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up --build -d

echo "Repository updated and knowledge base containers restarted."
