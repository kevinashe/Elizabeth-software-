# 🚀 SD Platform Infrastructure - Project Overview

## Complete Platform Engineering Solution

This repository contains a **production-ready platform engineering solution** for Azure Kubernetes Service (AKS), featuring:
- Complete Infrastructure as Code (Terraform & Bicep)
- GitHub Actions CI/CD pipelines with security scanning
- Event-driven SDK with voice-command integration
- GitOps deployment automation
- Code generation for multi-language clients

---

## 📊 Project Statistics

| Metric | Count |
|--------|-------|
| **Project Files** | 65+ |
| **GitHub Workflows** | 5 |
| **Event Adapters** | 3 |
| **Middleware Components** | 4 |
| **Terraform Modules** | 3 |
| **Bicep Modules** | 3 |
| **Helm Templates** | 8 |

---

## 🏗️ Infrastructure Components

### 1. Terraform Modules (`/modules`)

**Complete IaC for Azure resources including AKS, ACR, and Key Vault**

- ✅ **Azure Kubernetes Service** - Production cluster with autoscaling and network policies
- ✅ **Container Registry** - Private ACR with geo-replication
- ✅ **Key Vault** - Secrets management with RBAC
- ✅ Complete variables, outputs, and example configurations

**Files:**
- `modules/aks/main.tf` - AKS cluster configuration
- `modules/acr/main.tf` - Container registry setup
- `modules/keyvault/main.tf` - Key Vault and secrets

---

### 2. Bicep Templates (`/bicep`)

**Alternative ARM templates for rapid Azure deployment**

- ✅ **Modular Design** - Reusable modules for common resources
- ✅ **Parameter Files** - Environment-specific configurations (dev, staging, prod)
- ✅ **Output Exports** - Resource IDs and connection strings

**Files:**
- `bicep/main.bicep` - Main orchestration template
- `bicep/modules/aks.bicep` - AKS cluster
- `bicep/modules/acr.bicep` - Container registry
- `bicep/modules/keyvault.bicep` - Key Vault

---

### 3. Helm Charts (`/my-service-chart`)

**Production-grade Kubernetes manifests with best practices**

- ✅ **Full Stack** - Deployment, Service, Ingress, HPA
- ✅ **Security** - Pod security contexts and network policies
- ✅ **Observability** - Prometheus annotations and health checks

**Templates:**
- `deployment.yaml` - Main application deployment
- `service.yaml` - Kubernetes service
- `ingress.yaml` - Ingress controller configuration
- `hpa.yaml` - Horizontal Pod Autoscaler
- `secret.yaml` - Secret management
- `serviceaccount.yaml` - RBAC configuration
- `otel-collector-configmap.yaml` - OpenTelemetry setup

---

## 🔄 CI/CD Pipelines (`.github/workflows`)

### 1. ci-build-test.yml - Build, Test, Scan, Push

**Automated build pipeline with security scanning**

**Steps:**
1. ✅ Checkout code and set up Node.js
2. ✅ Run linters and unit tests
3. ✅ Build Docker image with multi-stage build
4. ✅ Login to ACR via Azure OIDC (no credentials!)
5. ✅ Scan with Trivy for vulnerabilities
6. ✅ Generate SBOM with Syft
7. ✅ Push to Azure Container Registry

---

### 2. ci-codegen.yml - Code Generation Validation

**Validate proto/OpenAPI code generation**

**Steps:**
1. ✅ Install protoc and OpenAPI tools
2. ✅ Generate Go, Python, TypeScript clients
3. ✅ Check for uncommitted changes
4. ✅ Fail if generated code out of sync

---

### 3. cd-gitops-promote.yml - Image Promotion

**Automated image promotion to infrastructure repo**

**Steps:**
1. ✅ Trigger on successful main build
2. ✅ Checkout infrastructure repository
3. ✅ Update Helm values with new image tag using yq
4. ✅ Create pull request for review
5. ✅ Auto-label and assign reviewers

---

### 4. cd-deploy-gitops-sync.yml - Infrastructure Deployment

**GitOps deployment automation**

**Steps:**
1. ✅ Reconcile Flux CD sources
2. ✅ Apply Kubernetes manifests
3. ✅ Verify deployments

---

### 5. security-scan.yml - Security Analysis

**Comprehensive security analysis in every build**

**Scans:**
1. ✅ Trivy filesystem scanning
2. ✅ Gitleaks secret detection
3. ✅ CodeQL static analysis
4. ✅ Upload results to GitHub Security tab

---

## ⚡ Event-Driven SDK (`/sdk`)

### Core Framework (`/sdk/src/core`)

**Built on Azure Event Hubs with composable middleware pipeline**

- `app.ts` - Event routing, middleware pipeline, lifecycle management
- `context.ts` - Per-event context with services (Event Hubs, Key Vault, Supabase)
- `types.ts` - Full TypeScript definitions

**Technologies:** TypeScript, Event Hubs, Supabase

---

### Adapters (`/sdk/src/adapters`)

**Multiple input sources for events**

1. **HttpAdapter** - Express-based HTTP webhook receiver
2. **EventHubsAdapter** - Azure Event Hubs consumer/producer
3. **SpeechAdapter** - Azure Speech-to-Text for voice commands

---

### Middleware (`/sdk/src/middleware`)

**Security and observability built-in**

1. **Tracing** - Distributed tracing with trace IDs
2. **Authentication** - Azure AD integration with role-based access
3. **Validation** - Zod schema validation
4. **Rate Limiting** - Per-user/source rate limits

---

### SDK Features

- ✅ Pattern matching with regex and conditions
- ✅ Command pattern for CQRS
- ✅ Idempotency handling
- ✅ Automatic retry and DLQ
- ✅ Supabase database integration
- ✅ Azure Key Vault secrets

---

### SDK Usage Example

```typescript
import { App, HttpAdapter, SpeechAdapter } from '@sdplatform/bolt-sdk';

const app = new App({
  serviceName: 'voice-notes',
  azure: { speechKey: process.env.AZURE_SPEECH_KEY },
  supabase: { url: process.env.SUPABASE_URL }
});

// Register middleware
app.use(tracingMiddleware());
app.use(authenticationMiddleware());

// Handle voice notes
app.on('voice.note.created', async (ctx, event) => {
  const note = await ctx.persist('notes', {
    title: event.payload.text.split('.')[0],
    content: event.payload.text
  });

  await ctx.emit({
    type: 'note.saved',
    payload: { note }
  });
});

// Start adapters
const http = new HttpAdapter(app, 8080);
const speech = new SpeechAdapter(app, speechKey, 'eastus');
speech.bindToExpress(http.getExpressApp());

await app.start();
```

---

## 📦 Additional Components

### Code Generation (`/proto`, `/openapi`)

**Proto/gRPC:**
- Service definitions for RequirementService
- Generation scripts for Go, Python, TypeScript
- Docker-based codegen for CI

**OpenAPI:**
- REST API specification
- Client generation for multiple languages
- Validation and documentation

---

### Utility Scripts (`/tools`)

- `setup-azure-oidc.sh` - Configure GitHub OIDC for Azure
- `promote-update-values.sh` - Manual image promotion helper
- `build-codegen.sh` - Master code generation script

---

## 📁 Project Structure

```
sd-infra-demo/
├── .github/
│   ├── workflows/              # CI/CD pipelines (5 workflows)
│   │   ├── ci-build-test.yml
│   │   ├── ci-codegen.yml
│   │   ├── cd-gitops-promote.yml
│   │   ├── cd-deploy-gitops-sync.yml
│   │   └── security-scan.yml
│   ├── CODEOWNERS
│   ├── dependabot.yml
│   └── PULL_REQUEST_TEMPLATE.md
├── modules/                    # Terraform modules
│   ├── aks/                   # AKS cluster
│   ├── acr/                   # Container registry
│   └── keyvault/              # Key Vault
├── bicep/                     # Bicep templates
│   ├── main.bicep
│   ├── parameters.dev.json
│   └── modules/
│       ├── aks.bicep
│       ├── acr.bicep
│       └── keyvault.bicep
├── my-service-chart/          # Helm chart
│   ├── Chart.yaml
│   ├── values.yaml
│   ├── NOTES.txt
│   └── templates/
│       ├── deployment.yaml
│       ├── service.yaml
│       ├── ingress.yaml
│       ├── hpa.yaml
│       ├── secret.yaml
│       ├── serviceaccount.yaml
│       └── otel-collector-configmap.yaml
├── sdk/                       # Event-driven SDK
│   ├── src/
│   │   ├── core/             # App, Context, Types
│   │   ├── adapters/         # HTTP, Event Hubs, Speech
│   │   ├── middleware/       # Tracing, Auth, Validation
│   │   └── examples/         # Usage examples
│   ├── package.json
│   └── README.md
├── proto/                     # gRPC definitions
│   ├── sdplatform.proto
│   └── gen.sh
├── openapi/                   # REST API specs
│   ├── api.yaml
│   └── gen.sh
├── tools/                     # Utility scripts
│   ├── build-codegen.sh
│   └── codegen-dockerfile
├── dashboard/                 # Interactive dashboard
│   └── src/
│       ├── App.tsx
│       └── styles/
├── main.tf                    # Root Terraform
├── variables.tf
├── outputs.tf
├── providers.tf
├── versions.tf
├── terraform.tfvars.example
├── README.md
├── SECURITY.md
└── PROJECT_SUMMARY.md
```

---

## 🔐 Security Features

| Feature | Tool | Description |
|---------|------|-------------|
| **Azure OIDC** | GitHub Actions | Passwordless authentication |
| **Container Scanning** | Trivy | Vulnerability detection |
| **Secret Scanning** | Gitleaks | Commit history analysis |
| **SBOM Generation** | Syft | Software bill of materials |
| **Static Analysis** | CodeQL | Code quality checks |
| **Network Policies** | Kubernetes | Network isolation |
| **Pod Security** | K8s | Non-root, read-only FS |
| **Key Vault** | Azure | Centralized secrets |

---

## 🚀 Quick Start

### 1. Provision Infrastructure

```bash
cd terraform
terraform init
terraform apply -var-file="terraform.tfvars"
```

### 2. Configure GitHub

```bash
export AZURE_SUBSCRIPTION_ID="your-subscription-id"
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

### 5. Send Voice Note

```bash
curl -X POST http://localhost:8080/voice-note \
  -H "Content-Type: application/json" \
  -d '{"audioBase64": "base64-encoded-audio", "user": {"id": "123"}}'
```

---

## 🎯 Use Cases

### 1. Voice-Command Requirements

Record audio → Send to API → SDK transcribes → Create requirement → Store in DB

```bash
curl -X POST http://localhost:8080/voice-note \
  -d '{"audioBase64": "...", "user": {"id": "123"}}'
```

### 2. Event-Driven Architecture

```typescript
app.on('requirement.created', async (ctx, event) => {
  await ctx.persist('requirements', event.payload);
  await ctx.emit({ type: 'requirement.indexed' });
});
```

### 3. GitOps Deployment

Push to main → Build → Scan → Push to ACR → Create PR in infra repo → Review → Merge → Deploy

---

## 🔗 Integration Points

- **Azure Event Hubs** - Event streaming
- **Azure Speech Services** - Voice transcription
- **Azure Key Vault** - Secrets management
- **Azure Container Registry** - Image storage
- **Azure Kubernetes Service** - Container orchestration
- **Supabase** - Database and authentication
- **GitHub Actions** - CI/CD automation
- **Flux CD** - GitOps deployments
- **Prometheus** - Metrics and monitoring
- **OpenTelemetry** - Distributed tracing

---

## 📝 Next Steps

1. ✅ **Customize Infrastructure** - Update `terraform.tfvars` for your environment
2. ✅ **Configure Secrets** - Add Azure credentials to GitHub Secrets
3. ✅ **Deploy Services** - Push code to trigger pipelines
4. ✅ **Set Up Monitoring** - Configure Azure Monitor and Application Insights
5. ✅ **Scale Applications** - Adjust HPA settings for your workload
6. ✅ **Add Services** - Extend SDK with new event handlers

---

## 🎓 Key Concepts

### Infrastructure as Code (IaC)
- Declarative infrastructure definitions
- Version-controlled configurations
- Repeatable deployments across environments

### GitOps
- Git as single source of truth
- Pull-based deployments with Flux CD
- Automated reconciliation

### Event-Driven Architecture
- Loose coupling between services
- Scalable message processing
- Event sourcing patterns

### Security by Default
- Zero-trust networking
- Least privilege access
- Automated vulnerability scanning

---

## 📚 Documentation Files

- `/README.md` - Main project overview
- `/sdk/README.md` - SDK documentation and examples
- `/SECURITY.md` - Security policies and practices
- `/PROJECT_SUMMARY.md` - Complete project summary
- `/dashboard/README.md` - Dashboard usage guide

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linters
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Submit a pull request

---

## 📄 License

MIT License - See LICENSE file for details

---

**Built with ❤️ for platform engineering teams**

*Complete enterprise-grade platform solution for Azure Kubernetes Service*
