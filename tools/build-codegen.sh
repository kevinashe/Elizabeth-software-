#!/usr/bin/env bash
set -euo pipefail

echo "=========================================="
echo "Starting code generation..."
echo "=========================================="
echo ""

cd "$(dirname "$0")/.."

# Run proto code generation
echo "Step 1: Generating gRPC clients from protobuf..."
echo "------------------------------------------"
if [ -f "./proto/gen.sh" ]; then
    chmod +x ./proto/gen.sh
    ./proto/gen.sh
else
    echo "Error: proto/gen.sh not found"
    exit 1
fi

echo ""
echo "Step 2: Generating OpenAPI clients..."
echo "------------------------------------------"
if [ -f "./openapi/gen.sh" ]; then
    chmod +x ./openapi/gen.sh
    ./openapi/gen.sh || echo "OpenAPI generation skipped (openapi-generator-cli may not be installed)"
else
    echo "Error: openapi/gen.sh not found"
    exit 1
fi

echo ""
echo "=========================================="
echo "Code generation complete!"
echo "=========================================="
echo ""
echo "Generated clients/servers are available at:"
echo "  - services/ts-client/"
echo "  - services/go-client/"
echo "  - services/py-client/"
