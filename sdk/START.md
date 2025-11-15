# SD Platform - Quick Start Guide

## What You Have

A fully functional event-driven platform with:
- Event routing and processing
- Supabase database integration
- HTTP API endpoints
- Rate limiting and middleware
- Distributed tracing
- Real-time event handling

## Prerequisites

- Node.js 18+ installed
- Supabase database configured (already done!)
- Environment variables set (already done!)

## Starting the System

### Option 1: Run the Demo Server

```bash
cd sdk
npm run demo
```

The server will start on http://localhost:8080

### Option 2: Run in Background

```bash
cd sdk
nohup npm run demo > server.log 2>&1 &
```

## Testing the System

### Test 1: Create a Simple Requirement

```bash
cd sdk
node test-client.js
```

This will create 5 example requirements and store them in Supabase.

### Test 2: Manual API Test

```bash
curl -X POST http://localhost:8080/event \
  -H "Content-Type: application/json" \
  -d '{
    "type": "requirement.create",
    "payload": {
      "title": "Add user notifications",
      "description": "Implement email and push notifications",
      "tags": ["notifications", "urgent"],
      "metadata": {
        "priority": "high",
        "assignee": "john@example.com"
      }
    },
    "source": "api-test",
    "user": {
      "id": "user-456",
      "email": "test@example.com"
    }
  }'
```

### Test 3: Health Check

```bash
curl http://localhost:8080/health
```

## What Happens When You Send an Event

1. **HTTP Adapter** receives the event on `/event` endpoint
2. **Tracing Middleware** adds trace ID for distributed tracking
3. **Rate Limit Middleware** checks request limits (100 per minute)
4. **Validation Middleware** validates the payload against schema
5. **Event Handler** processes the event:
   - Creates a requirement record
   - Stores it in Supabase database
   - Emits a `requirement.created` event
6. **Pattern Matchers** check for urgent tags and log warnings

## Viewing Your Data

Check your requirements in Supabase:

```bash
# List all tables
npm run supabase:list

# Or query directly in your Supabase dashboard:
# https://srrgniyqyuiqheqdefop.supabase.co
```

## Event Types

### `requirement.create`
Creates a new requirement in the database

**Payload:**
```json
{
  "title": "string (required, 1-200 chars)",
  "description": "string (optional)",
  "tags": ["array", "of", "strings"],
  "metadata": {
    "key": "value"
  }
}
```

### `requirement.created`
Emitted after a requirement is successfully created

**Payload:**
```json
{
  "requirement": {
    "id": "req-123456789",
    "title": "...",
    "description": "...",
    "tags": [],
    "created_at": "2025-11-11T02:00:00Z"
  }
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    HTTP Request                         │
│                (POST /event)                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│               HTTP Adapter                              │
│         (Converts HTTP → Event)                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│             Middleware Pipeline                         │
│  ┌──────────────────────────────────────────────┐       │
│  │ 1. Tracing (adds trace_id)                  │       │
│  │ 2. Rate Limiting (100/min per user)          │       │
│  │ 3. Validation (checks payload schema)        │       │
│  └──────────────────────────────────────────────┘       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Event Handlers                             │
│  ┌──────────────────────────────────────────────┐       │
│  │ • requirement.create handler                 │       │
│  │ • requirement.created handler                │       │
│  │ • Pattern matchers (urgent tags)             │       │
│  └──────────────────────────────────────────────┘       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│             Supabase Database                           │
│  ┌──────────────────────────────────────────────┐       │
│  │ requirements table                           │       │
│  │ - id, title, description                     │       │
│  │ - tags, metadata, user_id                    │       │
│  │ - created_at, updated_at                     │       │
│  └──────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

## Key Features

### 1. Event-Driven Architecture
All operations are events that flow through the system, allowing for:
- Loose coupling between components
- Easy extensibility
- Audit trails and event sourcing

### 2. Middleware Pipeline
Every event passes through middleware:
- **Tracing**: Distributed request tracking
- **Auth**: User authentication (optional)
- **Rate Limiting**: Prevent abuse
- **Validation**: Schema validation with Zod

### 3. Pattern Matching
Match events by:
- Type (exact or regex): `/^requirement\..*/`
- Source: Where the event came from
- Conditions: Custom logic (e.g., urgent tags)

### 4. Idempotency
Duplicate events are automatically detected and skipped using idempotency keys.

### 5. Database Integration
Direct Supabase integration with:
- `ctx.persist()`: Insert data
- `ctx.query()`: Query data
- Row-level security enabled

## Extending the System

### Add a New Event Type

```typescript
// In simple-demo.ts

app.on('user.registered', async (ctx, event) => {
  const { email, name } = event.payload;

  const user = {
    id: `user-${Date.now()}`,
    email,
    name,
    created_at: new Date().toISOString()
  };

  await ctx.persist('users', user);

  ctx.logger.info({ userId: user.id }, 'User registered');
});
```

### Add Custom Middleware

```typescript
const loggingMiddleware = () => {
  return async (ctx, event, next) => {
    const start = Date.now();

    await next();

    const duration = Date.now() - start;
    ctx.logger.info({ duration, eventType: event.type }, 'Event processed');
  };
};

app.use(loggingMiddleware());
```

### Add a Pattern Handler

```typescript
app.match(
  {
    type: /^payment\..*/,
    condition: (event) => event.payload.amount > 10000
  },
  async (ctx, event) => {
    // Alert for high-value payments
    ctx.logger.warn({ amount: event.payload.amount }, 'High-value payment');
  }
);
```

## Troubleshooting

### Port Already in Use
```bash
# Kill existing process
lsof -ti:8080 | xargs kill -9

# Or use a different port
PORT=3000 npm run demo
```

### Supabase Connection Error
Check your `.env` file has:
```
VITE_SUPABASE_URL=https://srrgniyqyuiqheqdefop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### TypeScript Errors
```bash
# Rebuild
npm run build
```

## Next Steps

1. **Add Authentication**: Enable auth middleware for protected endpoints
2. **Add More Tables**: Create users, projects, comments tables
3. **Event Sourcing**: Store all events in an events table
4. **Azure Integration**: Add Event Hubs for distributed event streaming
5. **Voice Commands**: Enable speech-to-text with Azure Speech Services
6. **Deploy**: Use the included Terraform/Helm charts to deploy to AKS

## Support

- Check logs: `tail -f sdk/server.log` (if running in background)
- View database: Supabase dashboard
- Test endpoints: Use the test-client.js script
- Read code: All source in `sdk/src/`

Happy building!
