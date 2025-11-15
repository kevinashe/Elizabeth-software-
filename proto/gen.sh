#!/usr/bin/env bash
set -euo pipefail

PROTO_DIR="$(cd "$(dirname "$0")" && pwd)"
OUT_DIR="$(pwd)/services"

mkdir -p "$OUT_DIR"

# Adjust these to installed protoc plugin paths or use docker image

# Generate Go
echo "Generating Go client..."
mkdir -p "$OUT_DIR/go-client"
protoc -I="$PROTO_DIR" \
  --go_out="$OUT_DIR/go-client" \
  --go_opt=paths=source_relative \
  --go-grpc_out="$OUT_DIR/go-client" \
  --go-grpc_opt=paths=source_relative \
  "$PROTO_DIR/sdplatform.proto" 2>/dev/null || echo "Note: Install protoc-gen-go and protoc-gen-go-grpc for Go generation"

# Generate Python
echo "Generating Python client..."
mkdir -p "$OUT_DIR/py-client"
python3 -m grpc_tools.protoc -I="$PROTO_DIR" \
  --python_out="$OUT_DIR/py-client" \
  --grpc_python_out="$OUT_DIR/py-client" \
  "$PROTO_DIR/sdplatform.proto" 2>/dev/null || echo "Note: Install grpcio-tools for Python generation"

# Generate TypeScript via ts-proto
echo "Generating TypeScript client..."
mkdir -p "$OUT_DIR/ts-client"
protoc -I="$PROTO_DIR" \
  --plugin=protoc-gen-ts_proto=$(which protoc-gen-ts_proto 2>/dev/null || echo "missing") \
  --ts_proto_out="$OUT_DIR/ts-client" \
  --ts_proto_opt=outputServices=grpc-js \
  "$PROTO_DIR/sdplatform.proto" 2>/dev/null || echo "Note: Install ts-proto for TypeScript generation (npm install -g ts-proto)"

echo "Proto code generation complete."
echo ""
echo "Make sure you have required plugins:"
echo "  - protoc-gen-go, protoc-gen-go-grpc (Go)"
echo "  - grpcio-tools / grpcio (Python)"
echo "  - ts-proto or protoc-gen-grpc-web (TypeScript)"
