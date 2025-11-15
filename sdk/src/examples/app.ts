import { App } from '../core/app';
import { HttpAdapter } from '../adapters/httpAdapter';
import { SpeechAdapter } from '../adapters/speechAdapter';
import { tracingMiddleware } from '../middleware/tracing';
import { authenticationMiddleware } from '../middleware/authentication';
import { rateLimitMiddleware } from '../middleware/rateLimit';
import { z } from 'zod';
import { validationMiddleware } from '../middleware/validation';

const config = {
  serviceName: 'sd-platform-demo',
  azure: {
    keyVaultName: process.env.AZURE_KEYVAULT_NAME,
    eventHubsNamespace: process.env.AZURE_EVENTHUBS_NAMESPACE,
    eventHubName: process.env.AZURE_EVENTHUB_NAME,
    speechKey: process.env.AZURE_SPEECH_KEY || '',
    speechRegion: process.env.AZURE_SPEECH_REGION || 'eastus',
  },
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
  authenticationMiddleware({
    allowAnonymous: true,
    publicEventTypes: ['voice.note.created', 'health.check'],
  })
);

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

app.on('voice.note.created', async (ctx, event) => {
  ctx.logger.info({ event }, 'Processing voice note');

  const text = event.payload.text;
  if (!text) {
    ctx.logger.warn('Empty transcription, skipping');
    return;
  }

  const sentences = text.split(/[.?!]\s+/).filter((s: string) => s.trim().length > 0);
  const title = sentences[0]?.slice(0, 140) || 'Voice Note';
  const description = text;

  const requirement = {
    id: `req-${Date.now()}`,
    title,
    description,
    tags: ['voice', 'transcribed'],
    metadata: {
      source: event.source,
      original_filename: event.payload.originalFilename,
      transcribed_at: new Date().toISOString(),
    },
    user_id: event.user?.id,
    created_at: new Date().toISOString(),
  };

  try {
    const saved = await ctx.persist('requirements', requirement);
    ctx.logger.info({ requirementId: saved.id }, 'Requirement created from voice note');

    await ctx.emit({
      id: `evt-${Date.now()}`,
      type: 'requirement.created',
      payload: { requirement: saved },
      created_at: new Date().toISOString(),
      source: 'sdk',
      trace_id: event.trace_id,
      user: event.user,
    });
  } catch (error) {
    ctx.logger.error({ error }, 'Failed to create requirement');
    throw error;
  }
});

app.on('requirement.created', async (ctx, event) => {
  ctx.logger.info({ requirement: event.payload.requirement }, 'Requirement created');
});

app.command('createRequirement', async (ctx, event) => {
  const { title, description, tags, metadata } = event.payload;

  const requirement = {
    id: `req-${Date.now()}`,
    title,
    description: description || '',
    tags: tags || [],
    metadata: metadata || {},
    user_id: event.user?.id,
    created_at: new Date().toISOString(),
  };

  const saved = await ctx.persist('requirements', requirement);

  await ctx.emit({
    id: `evt-${Date.now()}`,
    type: 'requirement.created',
    payload: { requirement: saved },
    created_at: new Date().toISOString(),
    source: 'command',
    trace_id: event.trace_id,
    user: event.user,
  });
});

app.match(
  {
    type: /^requirement\..*/,
    condition: (event) => event.payload.requirement?.tags?.includes('urgent'),
  },
  async (ctx, event) => {
    ctx.logger.warn(
      { requirement: event.payload.requirement },
      'Urgent requirement detected'
    );
  }
);

const httpAdapter = new HttpAdapter(app, config.http.port);
app.registerAdapter(httpAdapter);

if (config.azure.speechKey) {
  const speechAdapter = new SpeechAdapter(
    app,
    config.azure.speechKey,
    config.azure.speechRegion
  );

  speechAdapter.bindToExpress(httpAdapter.getExpressApp(), '/voice-note');
  app.registerAdapter(speechAdapter);
}

(async () => {
  try {
    await app.start();

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
