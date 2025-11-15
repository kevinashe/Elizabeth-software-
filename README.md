# Elizabeth - AI-Powered Development Platform

**Enterprise-grade AI development platform with voice interaction, real-time collaboration, and comprehensive DevOps features.**

## 🎙️ Voice Assistant - NEW!

Elizabeth now responds when you call her name! Just say **"Elizabeth"** and she'll help you navigate and control the platform with natural voice commands.

### Quick Start
1. Click "Talk to Elizabeth" button
2. Say "Elizabeth" to activate
3. Give voice commands naturally
4. Elizabeth responds and takes action

**See [VOICE_ASSISTANT_GUIDE.md](VOICE_ASSISTANT_GUIDE.md) for complete voice features.**

---

## 🚀 What is Elizabeth?

Elizabeth is a complete AI-powered development platform that combines code generation, protobuf/OpenAPI tooling, real-time collaboration, voice interaction, and enterprise DevOps features.

## Structure

```
.
├── proto/                  # gRPC/protobuf definitions
│   ├── sdplatform.proto   # Service definitions
│   └── gen.sh             # Proto code generation script
├── openapi/               # OpenAPI/REST definitions
│   ├── api.yaml          # API specification
│   └── gen.sh            # OpenAPI code generation script
├── services/              # Generated code output
│   ├── ts-client/        # TypeScript clients
│   ├── go-client/        # Go clients
│   └── py-client/        # Python clients
├── tools/                 # Build tooling
│   ├── codegen-dockerfile # Docker image for code generation
│   └── build-codegen.sh  # Master build script
└── README.md
```

## Prerequisites

### Local Development

Install the following dependencies:

**Core Tools:**
- `protoc` (Protocol Buffers compiler)
- `openapi-generator-cli` (OpenAPI Generator)

**Go Plugins:**
```bash
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest
```

**Python Tools:**
```bash
pip install grpcio grpcio-tools
```

**TypeScript/Node Tools:**
```bash
npm install -g ts-proto
npm install -g @openapitools/openapi-generator-cli
```

### Docker (Alternative)

Build the code generation Docker image:
```bash
cd tools
docker build -f codegen-dockerfile -t sdplatform-codegen ..
```

## Quickstart

### Option 1: Local Generation

```bash
# Make scripts executable
chmod +x proto/gen.sh openapi/gen.sh tools/build-codegen.sh

# Run code generation
./tools/build-codegen.sh
```

Generated clients/servers will appear under `services/{ts-client,go-client,py-client}`.

### Option 2: Docker Generation

```bash
docker run --rm -v $(pwd):/work sdplatform-codegen
```

## Generated Outputs

### gRPC/Protobuf Clients

- **Go**: `services/go-client/` - gRPC client with generated types
- **Python**: `services/py-client/` - gRPC client with generated stubs
- **TypeScript**: `services/ts-client/` - gRPC-JS client with types

### OpenAPI/REST Clients

- **Go**: `services/go-client/openapi/` - REST client using Go
- **Python**: `services/py-client/openapi/` - REST client using requests
- **TypeScript**: `services/ts-client/openapi-client/` - Axios-based REST client

## Usage Examples

### TypeScript (gRPC)

```typescript
import { RequirementServiceClient } from './services/ts-client/sdplatform';

const client = new RequirementServiceClient('localhost:50051');
const response = await client.createRequirement({
  title: 'New Requirement',
  description: 'Description here',
  tags: ['api', 'v1']
});
```

### Python (gRPC)

```python
import grpc
from services.py_client import sdplatform_pb2, sdplatform_pb2_grpc

channel = grpc.insecure_channel('localhost:50051')
stub = sdplatform_pb2_grpc.RequirementServiceStub(channel)
response = stub.CreateRequirement(sdplatform_pb2.Requirement(
    title='New Requirement',
    description='Description here',
    tags=['api', 'v1']
))
```

### Go (gRPC)

```go
import (
    pb "github.com/example/sdplatform/gen/go"
    "google.golang.org/grpc"
)

conn, _ := grpc.Dial("localhost:50051", grpc.WithInsecure())
client := pb.NewRequirementServiceClient(conn)
response, _ := client.CreateRequirement(context.Background(), &pb.Requirement{
    Title: "New Requirement",
    Description: "Description here",
    Tags: []string{"api", "v1"},
})
```

## Customization

### Modify Proto Definitions

Edit `proto/sdplatform.proto` and re-run generation:
```bash
./proto/gen.sh
```

### Modify OpenAPI Specification

Edit `openapi/api.yaml` and re-run generation:
```bash
./openapi/gen.sh
```

## CI/CD Integration

Add to your CI pipeline:

```yaml
# .github/workflows/codegen.yml
name: Code Generation
on: [push, pull_request]
jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run code generation
        run: |
          chmod +x tools/build-codegen.sh
          ./tools/build-codegen.sh
      - name: Commit generated code
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add services/
          git commit -m "chore: regenerate clients" || true
```

## Troubleshooting

**Issue**: `protoc: command not found`
- **Solution**: Install Protocol Buffers: `brew install protobuf` (macOS) or download from [GitHub releases](https://github.com/protocolbuffers/protobuf/releases)

**Issue**: `openapi-generator-cli: command not found`
- **Solution**: Install via npm: `npm install -g @openapitools/openapi-generator-cli`

**Issue**: Plugin not found (protoc-gen-go, etc.)
- **Solution**: Ensure Go bin is in PATH: `export PATH=$PATH:$(go env GOPATH)/bin`

## License

MIT
