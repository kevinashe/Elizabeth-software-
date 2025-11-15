import { App } from '../core/app';
import { HttpAdapter } from '../adapters/httpAdapter';
import { tracingMiddleware } from '../middleware/tracing';
import { rateLimitMiddleware } from '../middleware/rateLimit';
import { z } from 'zod';
import { validationMiddleware } from '../middleware/validation';

const config = {
  serviceName: 'sd-platform-simple-demo',
  supabase: {
    url: process.env.VITE_SUPABASE_URL || '',
    anonKey: process.env.VITE_SUPABASE_ANON_KEY || '',
  },
  http: {
    port: parseInt(process.env.PORT || '8080', 10),
  },
};

const app = new App(config);

app.use(tracingMiddleware());

app.use(
  rateLimitMiddleware({
    maxEvents: 100,
    windowMs: 60000,
    keyExtractor: (event) => event.user?.id || event.source || 'anonymous',
  })
);

const schemas = new Map();
schemas.set(
  'requirement.create',
  z.object({
    title: z.string().min(1).max(200),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    metadata: z.record(z.string()).optional(),
  })
);

app.use(validationMiddleware(schemas));

app.on('requirement.create', async (ctx, event) => {
  ctx.logger.info({ event }, 'Creating requirement');

  const { title, description, tags, metadata } = event.payload;

  const requirement = {
    id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title,
    description: description || '',
    tags: tags || [],
    metadata: metadata || {},
    user_id: event.user?.id || 'anonymous',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const saved = await ctx.persist('requirements', requirement);
    ctx.logger.info({ requirementId: saved.id }, 'Requirement created successfully');

    await ctx.emit({
      id: `evt-${Date.now()}`,
      type: 'requirement.created',
      payload: { requirement: saved },
      created_at: new Date().toISOString(),
      source: 'sdk',
      trace_id: event.trace_id,
      user: event.user,
    });

    return saved;
  } catch (error) {
    ctx.logger.error({ error }, 'Failed to create requirement');
    throw error;
  }
});

app.on('requirement.created', async (ctx, event) => {
  ctx.logger.info(
    {
      requirementId: event.payload.requirement.id,
      title: event.payload.requirement.title
    },
    'Requirement created event received'
  );
});

app.match(
  {
    type: /^requirement\..*/,
    condition: (event) => event.payload.requirement?.tags?.includes('urgent'),
  },
  async (ctx, event) => {
    ctx.logger.warn(
      {
        requirement: event.payload.requirement,
        tags: event.payload.requirement?.tags
      },
      '🚨 URGENT requirement detected!'
    );
  }
);

const httpAdapter = new HttpAdapter(app, config.http.port);
app.registerAdapter(httpAdapter);

(async () => {
  try {
    await app.start();

    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 SD Platform Demo Server Running                      ║
║                                                            ║
║   📡 HTTP Endpoint: http://localhost:${config.http.port}               ║
║                                                            ║
║   Test the API:                                           ║
║   POST http://localhost:${config.http.port}/event                    ║
║                                                            ║
║   Example payload:                                        ║
║   {                                                       ║
║     "type": "requirement.create",                        ║
║     "payload": {                                         ║
║       "title": "Build authentication system",           ║
║       "description": "Implement user auth with JWT",    ║
║       "tags": ["auth", "security"]                      ║
║     }                                                    ║
║   }                                                      ║
║                                                           ║
╚════════════════════════════════════════════════════════════╝
    `);

    process.on('SIGTERM', async () => {
      app.logger.info('SIGTERM received, shutting down gracefully');
      await app.stop();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      app.logger.info('SIGINT received, shutting down gracefully');
      await app.stop();
      process.exit(0);
    });
  } catch (error) {
    app.logger.error({ error }, 'Failed to start application');
    process.exit(1);
  }
})();
