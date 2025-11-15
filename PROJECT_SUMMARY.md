# SD Platform Infrastructure - Complete Project Summary

## Overview
This repository contains a **production-ready platform engineering solution** for Azure Kubernetes Service (AKS), featuring:
- Complete Infrastructure as Code (Terraform & Bicep)
- GitHub Actions CI/CD pipelines with security scanning
- Event-driven SDK with voice-command integration
- GitOps deployment automation
- Code generation for multi-language clients

## 🏗️ What Was Built

### 1. Infrastructure as Code

#### Terraform Modules (`/terraform` & `/modules`)
- **AKS Module**: Production Kubernetes cluster with autoscaling, network policies
- **ACR Module**: Private container registry with geo-replication
- **Key Vault Module**: Secrets management with RBAC
- Complete with variables, outputs, and example configurations

#### Bicep Templates (`/bicep`)
- Alternative ARM templates for Azure deployment
- Modular design with parameters for dev/staging/prod
- Same resources as Terraform for flexibility

#### Helm Charts (`/my-service-chart`)
- Complete Kubernetes manifests (Deployment, Service, Ingress, HPA)
- Pod security contexts and network policies
- Prometheus annotations for observability
- Health checks and resource limits

### 2. CI/CD Pipelines (`/.github/workflows`)

#### `ci-build-test.yml` - Build, Test, Scan, Push
- Lint and unit test TypeScript service
- Build Docker image with multi-stage build
- Login to ACR via Azure OIDC (no credentials!)
- Scan with Trivy for vulnerabilities
- Generate SBOM with Syft
- Push to Azure Container Registry

#### `ci-codegen.yml` - Code Generation Validation
- Generate gRPC clients (Go, Python, TypeScript)
- Generate OpenAPI clients
- Fail if generated code is out of sync

#### `cd-gitops-promote.yml` - Image Promotion
- Triggers on successful main build
- Checkout infrastructure repository
- Update Helm values with new image tag using yq
- Create pull request for review
- Automated with labels and reviewers

#### `cd-deploy-gitops-sync.yml` - Infrastructure Deployment
- For infra repository
- Reconcile Flux CD sources
- Apply Kubernetes manifests
- Verify deployments

#### `security-scan.yml` - Security Analysis
- Trivy filesystem scanning
- Gitleaks secret detection
- CodeQL static analysis
- Upload to GitHub Security tab

### 3. Event-Driven SDK (`/sdk`)

#### Core Framework (`/sdk/src/core`)
- **App**: Event routing, middleware pipeline, lifecycle management
- **Context**: Per-event context with services (Event Hubs, Key Vault, Supabase)
- **Types**: Full TypeScript definitions

#### Adapters (`/sdk/src/adapters`)
- **HttpAdapter**: Express-based HTTP webhook receiver
- **EventHubsAdapter**: Azure Event Hubs consumer/producer
- **SpeechAdapter**: Azure Speech-to-Text for voice commands

#### Middleware (`/sdk/src/middleware`)
- **Tracing**: Distributed tracing with trace IDs
- **Authentication**: Azure AD integration with role-based access
- **Validation**: Zod schema validation
- **Rate Limiting**: Per-user/source rate limits

#### Features
- Pattern matching with regex and conditions
- Command pattern for CQRS
- Idempotency handling
- Automatic retry and DLQ
- Supabase database integration
- Azure Key Vault secrets

### 4. TypeScript Service (`/service`)
- Express REST API for requirements
- Structured logging with Pino
- Health check endpoints
- Multi-stage Dockerfile
- Unit test setup with Jest

### 5. Code Generation (`/proto`, `/openapi`)

#### Proto/gRPC (`/proto`)
- Service definitions for RequirementService
- Generation scripts for Go, Python, TypeScript
- Docker-based codegen for CI

#### OpenAPI (`/openapi`)
- REST API specification
- Client generation for multiple languages
- Validation and documentation

### 6. GitOps Infrastructure (`/infra`)
- Sample infrastructure repository structure
- Helm charts for services
- Values files for multiple environments
- Flux CD bootstrap configuration

### 7. Utility Scripts (`/tools`)
- **setup-azure-oidc.sh**: Configure GitHub OIDC for Azure
- **promote-update-values.sh**: Manual image promotion
- **build-codegen.sh**: Master codegen script

### 8. Dashboard (`/dashboard`)
- Interactive React dashboard showcasing the project
- Component breakdown and architecture visualization
- Code examples and usage patterns
- Deployment instructions

## 📊 Project Statistics

- **Total Files**: 65+
- **GitHub Workflows**: 5
- **Terraform Modules**: 3
- **Bicep Modules**: 3
- **Helm Templates**: 8
- **Event Adapters**: 3
- **Middleware Components**: 4
- **Lines of Code**: ~8,000+

## 🔐 Security Features

1. **Azure OIDC**: Passwordless GitHub Actions authentication
2. **Container Scanning**: Trivy vulnerability detection
3. **Secret Scanning**: Gitleaks for commit history
4. **SBOM Generation**: Software bill of materials
5. **Static Analysis**: CodeQL for code quality
6. **Network Policies**: Kubernetes network isolation
7. **Pod Security**: Non-root containers, read-only filesystem
8. **Key Vault**: Centralized secrets management

## 🚀 Quick Start

### 1. Provision Infrastructure
```bash
cd terraform
terraform init
terraform apply -var-file="terraform.tfvars"
```

### 2. Configure GitHub
```bash
export AZURE_SUBSCRIPTION_ID="..."
./tools/setup-azure-oidc.sh
```

### 3. Build and Deploy
```bash
git push origin main
# CI/CD automatically builds, scans, and deploys
```

### 4. Use the SDK
```bash
cd sdk
npm install
npm run dev
```

### 5. View Dashboard
```bash
cd dashboard
npm install
npm run dev
```

## 🎯 Use Cases

### Voice-Command Requirements
```bash
# Record audio, send to API
curl -X POST http://localhost:8080/voice-note \
  -d '{"audioBase64": "...", "user": {"id": "123"}}'

# SDK transcribes, creates requirement, stores in DB
```

### Event-Driven Architecture
```typescript
app.on('requirement.created', async (ctx, event) => {
  await ctx.persist('requirements', event.payload);
  await ctx.emit({ type: 'requirement.indexed' });
});
```

### GitOps Deployment
```bash
# Push to main → Build → Scan → Push to ACR
# → Create PR in infra repo → Review → Merge → Deploy
```

## 📁 Repository Structure

```
.
├── .github/workflows/       # CI/CD pipelines
├── terraform/              # Terraform IaC
├── bicep/                  # Bicep templates
├── my-service-chart/       # Helm charts
├── sdk/                    # Event-driven SDK
│   ├── src/
│   │   ├── core/          # App, Context, Types
│   │   ├── adapters/      # HTTP, Event Hubs, Speech
│   │   ├── middleware/    # Tracing, Auth, Validation
│   │   └── examples/      # Usage examples
├── service/               # TypeScript service
├── proto/                 # gRPC definitions
├── openapi/              # REST API specs
├── infra/                # GitOps repo structure
├── tools/                # Utility scripts
└── dashboard/            # Project overview UI
```

## 🎓 Key Concepts

### Infrastructure as Code
- Declarative infrastructure definitions
- Version-controlled configurations
- Repeatable deployments

### GitOps
- Git as single source of truth
- Pull-based deployments
- Automated reconciliation

### Event-Driven Architecture
- Loose coupling between services
- Scalable message processing
- Event sourcing patterns

### Security by Default
- Zero-trust networking
- Least privilege access
- Automated scanning

## 🔗 Integration Points

- **Azure Event Hubs**: Event streaming
- **Azure Speech Services**: Voice transcription
- **Azure Key Vault**: Secrets management
- **Azure Container Registry**: Image storage
- **Azure Kubernetes Service**: Container orchestration
- **Supabase**: Database and auth
- **GitHub Actions**: CI/CD automation
- **Flux CD**: GitOps deployments

## 📝 Next Steps

1. **Customize Infrastructure**: Update variables for your environment
2. **Configure Secrets**: Add Azure credentials to GitHub
3. **Deploy Services**: Push code to trigger pipelines
4. **Monitor**: Set up Azure Monitor and Application Insights
5. **Scale**: Adjust HPA settings for your workload

## 📚 Documentation

- `/README.md` - Main project overview
- `/sdk/README.md` - SDK documentation and examples
- `/infra/README.md` - GitOps repository guide
- `/dashboard/README.md` - Dashboard usage
- `/SECURITY.md` - Security policies and practices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linters
5. Submit a pull request

## 📄 License

MIT

---

**Built with ❤️ for platform engineering teams**
