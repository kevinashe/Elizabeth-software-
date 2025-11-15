#!/usr/bin/env bash
set -euo pipefail

OPENAPI_FILE="$(cd "$(dirname "$0")" && pwd)/api.yaml"
OUT_DIR="$(pwd)/services"

mkdir -p "$OUT_DIR"

# Check if openapi-generator-cli is available
if ! command -v openapi-generator-cli &> /dev/null; then
    echo "Warning: openapi-generator-cli not found."
    echo "Install with: npm install -g @openapitools/openapi-generator-cli"
    echo "Or use Docker: docker run --rm -v \${PWD}:/local openapitools/openapi-generator-cli generate ..."
    exit 1
fi

# JavaScript/TypeScript client via OpenAPI Generator
echo "Generating TypeScript client..."
openapi-generator-cli generate \
  -i "$OPENAPI_FILE" \
  -g typescript-axios \
  -o "$OUT_DIR/ts-client/openapi-client" \
  --additional-properties=npmName=@sdplatform/openapi-client,npmVersion=1.0.0,supportsES6=true

# Go server/client
echo "Generating Go client..."
openapi-generator-cli generate \
  -i "$OPENAPI_FILE" \
  -g go \
  -o "$OUT_DIR/go-client/openapi" \
  --additional-properties=packageName=openapi

# Python client
echo "Generating Python client..."
openapi-generator-cli generate \
  -i "$OPENAPI_FILE" \
  -g python \
  -o "$OUT_DIR/py-client/openapi" \
  --additional-properties=packageName=sdplatform_client,projectName=sdplatform-client

echo "OpenAPI code generation complete."
