# SD Platform Bolt SDK

Event-driven SDK for building scalable microservices on Azure with integrated voice-command capabilities.

## Features

- **Event-Driven Architecture**: Built on Azure Event Hubs with support for multiple adapters
- **Voice Integration**: Azure Cognitive Services Speech-to-Text for voice commands
- **Middleware Pipeline**: Composable middleware for tracing, auth, validation, and rate limiting
- **Type-Safe**: Full TypeScript support with strong typing
- **Pattern Matching**: Flexible event routing with pattern matching and conditions
- **Supabase Integration**: Built-in database persistence and querying
- **Azure Native**: DefaultAzureCredential, Key Vault, Event Hubs, Service Bus support

## Installation

```bash
npm install @sdplatform/bolt-sdk
```

## Quick Start

### Basic Application

```typescript
import { App, HttpAdapter, tracingMiddleware } from '@sdplatform/bolt-sdk';

const app = new App({
  serviceName: 'my-service',
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
  },
});

app.use(tracingMiddleware());

app.on('user.created', async (ctx, event) => {
  console.log('User created:', event.payload);

  await ctx.persist('users', event.payload);

  await ctx.emit({
    type: 'user.welcome',
    payload: { userId: event.payload.id },
  });
});

const httpAdapter = new HttpAdapter(app, 8080);
app.registerAdapter(httpAdapter);

await app.start();
```

### Voice Note Integration

```typescript
import { App, HttpAdapter, SpeechAdapter } from '@sdplatform/bolt-sdk';

const app = new App({
  serviceName: 'voice-notes',
  azure: {
    speechKey: process.env.AZURE_SPEECH_KEY,
    speechRegion: 'eastus',
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
  },
});

app.on('voice.note.created', async (ctx, event) => {
  const text = event.payload.text;

  const note = {
    title: text.split('.')[0],
    content: text,
    user_id: event.user?.id,
  };

  await ctx.persist('notes', note);
});

const httpAdapter = new HttpAdapter(app, 8080);
const speechAdapter = new SpeechAdapter(
  app,
  process.env.AZURE_SPEECH_KEY,
  'eastus'
);

speechAdapter.bindToExpress(httpAdapter.getExpressApp(), '/voice-note');

app.registerAdapter(httpAdapter);
app.registerAdapter(speechAdapter);

await app.start();
```

### Send Voice Note

```bash
# Record audio and encode to base64
AUDIO_BASE64=$(cat recording.wav | base64)

# Send to API
curl -X POST http://localhost:8080/voice-note \
  -H "Content-Type: application/json" \
  -d "{
    \"audioBase64\": \"$AUDIO_BASE64\",
    \"user\": { \"id\": \"user-123\" }
  }"
```

## Core Concepts

### Events

Events are the fundamental unit of communication:

```typescript
interface Event {
  id: string;
  type: string;
  payload: Record<string, any>;
  trace_id?: string;
  created_at: string;
  source?: string;
  user?: { id: string; roles?: string[] };
  metadata?: Record<string, any>;
}
```

### Handlers

Register handlers for specific event types:

```typescript
app.on('order.created', async (ctx, event) => {
  // Process order
});

app.on('order.cancelled', async (ctx, event) => {
  // Handle cancellation
});
```

### Pattern Matching

Match events with complex patterns:

```typescript
app.match(
  {
    type: /^order\..*/,
    condition: (event) => event.payload.total > 1000,
  },
  async (ctx, event) => {
    // Handle high-value orders
  }
);

app.match(
  {
    user: { roles: ['admin'] },
  },
  async (ctx, event) => {
    // Admin-only events
  }
);
```

### Commands

Commands are a special type of event:

```typescript
app.command('createUser', async (ctx, event) => {
  const user = await ctx.persist('users', event.payload);

  await ctx.emit({
    type: 'user.created',
    payload: user,
  });
});

// Invoke via HTTP
// POST /commands/createUser
```

## Middleware

### Tracing

```typescript
import { tracingMiddleware } from '@sdplatform/bolt-sdk';

app.use(tracingMiddleware());
```

### Authentication

```typescript
import { authenticationMiddleware } from '@sdplatform/bolt-sdk';

app.use(
  authenticationMiddleware({
    requiredRoles: ['user'],
    publicEventTypes: ['health.check'],
  })
);
```

### Validation

```typescript
import { validationMiddleware } from '@sdplatform/bolt-sdk';
import { z } from 'zod';

const schemas = new Map();
schemas.set(
  'user.create',
  z.object({
    email: z.string().email(),
    name: z.string().min(1),
  })
);

app.use(validationMiddleware(schemas));
```

### Rate Limiting

```typescript
import { rateLimitMiddleware } from '@sdplatform/bolt-sdk';

app.use(
  rateLimitMiddleware({
    maxEvents: 100,
    windowMs: 60000,
    keyExtractor: (event) => event.user?.id || 'anonymous',
  })
);
```

## Adapters

### HTTP Adapter

```typescript
const httpAdapter = new HttpAdapter(app, 8080, '/api');
app.registerAdapter(httpAdapter);
```

**Endpoints:**
- `POST /api/events` - Receive events
- `POST /api/commands/:commandName` - Execute commands
- `GET /api/health` - Health check

### Event Hubs Adapter

```typescript
import { EventHubsAdapter } from '@sdplatform/bolt-sdk';

const eventHubsAdapter = new EventHubsAdapter(
  app,
  'my-namespace',
  'my-hub',
  '$Default',
  false // Use managed identity
);

app.registerAdapter(eventHubsAdapter);
```

### Speech Adapter

```typescript
import { SpeechAdapter } from '@sdplatform/bolt-sdk';

const speechAdapter = new SpeechAdapter(
  app,
  process.env.AZURE_SPEECH_KEY,
  'eastus'
);

speechAdapter.bindToExpress(httpAdapter.getExpressApp());
app.registerAdapter(speechAdapter);
```

## Context API

The context object provides access to services and utilities:

```typescript
app.on('event.type', async (ctx, event) => {
  // Emit new event
  await ctx.emit({
    type: 'follow-up.event',
    payload: { data: 'value' },
  });

  // Persist to database
  const saved = await ctx.persist('collection', { name: 'value' });

  // Query database
  const results = await ctx.query('collection', { status: 'active' });

  // Get secret from Key Vault
  const secret = await ctx.getSecret('my-secret');

  // Access logger
  ctx.logger.info('Processing event');

  // Access metadata
  const traceId = ctx.meta.trace_id;
});
```

## Security Best Practices

### Use Managed Identity

```typescript
// DefaultAzureCredential automatically uses managed identity in production
const app = new App({
  serviceName: 'my-service',
  azure: {
    keyVaultName: 'my-vault',
  },
});
```

### Validate Input

```typescript
import { z } from 'zod';

const schemas = new Map();
schemas.set(
  'user.create',
  z.object({
    email: z.string().email(),
    age: z.number().min(18),
  })
);

app.use(validationMiddleware(schemas));
```

### Rate Limiting

```typescript
app.use(
  rateLimitMiddleware({
    maxEvents: 50,
    windowMs: 60000,
  })
);
```

### Authentication

```typescript
app.use(
  authenticationMiddleware({
    requiredRoles: ['user'],
  })
);
```

## Deployment

### Environment Variables

```bash
# Azure
AZURE_SPEECH_KEY=your-speech-key
AZURE_SPEECH_REGION=eastus
AZURE_KEYVAULT_NAME=my-vault
AZURE_EVENTHUBS_NAMESPACE=my-namespace
AZURE_EVENTHUB_NAME=my-hub

# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# App
PORT=8080
NODE_ENV=production
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist ./dist
EXPOSE 8080
CMD ["node", "dist/examples/app.js"]
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sdk-app
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: app
        image: myacr.azurecr.io/sdk-app:latest
        env:
        - name: AZURE_SPEECH_KEY
          valueFrom:
            secretKeyRef:
              name: azure-secrets
              key: speech-key
```

## Examples

See `src/examples/app.ts` for a complete working example.

## License

MIT
