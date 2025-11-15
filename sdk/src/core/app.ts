import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';
import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import { createClient } from '@supabase/supabase-js';
import { Context } from './context';
import {
  Event,
  Handler,
  Middleware,
  AppConfig,
  Adapter,
  EventPattern,
  ServiceRegistry,
} from './types';

export class App {
  logger: pino.Logger;
  middlewares: Middleware[] = [];
  handlers: Map<string, Handler[]> = new Map();
  patternHandlers: Array<{ pattern: EventPattern; handler: Handler }> = [];
  services: ServiceRegistry = {};
  adapters: Adapter[] = [];
  private processedEvents = new Set<string>();

  constructor(public config: AppConfig) {
    this.logger = pino({
      name: config.serviceName,
      transport: {
        target: 'pino-pretty',
        options: { colorize: true },
      },
    });

    this.initializeServices();
  }

  private initializeServices(): void {
    const credential = new DefaultAzureCredential();
    this.services.credential = credential;

    if (this.config.azure?.keyVaultName) {
      const vaultUrl = `https://${this.config.azure.keyVaultName}.vault.azure.net`;
      this.services.keyVault = new SecretClient(vaultUrl, credential);
      this.logger.info({ vaultUrl }, 'Key Vault client initialized');
    }

    if (this.config.supabase) {
      this.services.supabase = createClient(
        this.config.supabase.url,
        this.config.supabase.anonKey
      );
      this.logger.info('Supabase client initialized');
    }
  }

  use(middleware: Middleware): void {
    this.middlewares.push(middleware);
  }

  on(eventType: string, handler: Handler): void {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler);
    this.handlers.set(eventType, handlers);
    this.logger.debug({ eventType }, 'Handler registered');
  }

  match(pattern: EventPattern, handler: Handler): void {
    this.patternHandlers.push({ pattern, handler });
    this.logger.debug({ pattern }, 'Pattern handler registered');
  }

  command(commandName: string, handler: Handler): void {
    this.on(`command.${commandName}`, handler);
  }

  registerAdapter(adapter: Adapter): void {
    this.adapters.push(adapter);
    this.logger.info({ adapter: adapter.name }, 'Adapter registered');
  }

  async handleEvent(event: Event): Promise<void> {
    if (!event.id) {
      event.id = uuidv4();
    }

    if (!event.created_at) {
      event.created_at = new Date().toISOString();
    }

    const idempotencyKey = event.idempotency_key || event.id;
    if (this.processedEvents.has(idempotencyKey)) {
      this.logger.warn(
        { eventId: event.id, idempotencyKey },
        'Duplicate event detected, skipping'
      );
      return;
    }

    this.processedEvents.add(idempotencyKey);
    setTimeout(() => this.processedEvents.delete(idempotencyKey), 300000);

    const ctx = new Context(event, this.services, this.logger);

    const executeHandlers = async (): Promise<void> => {
      const typeHandlers = this.handlers.get(event.type) || [];
      const matchedHandlers = this.patternHandlers
        .filter(({ pattern }) => this.matchesPattern(event, pattern))
        .map(({ handler }) => handler);

      const allHandlers = [...typeHandlers, ...matchedHandlers];

      if (allHandlers.length === 0) {
        this.logger.debug({ eventType: event.type }, 'No handlers for event');
        return;
      }

      for (const handler of allHandlers) {
        try {
          await handler(ctx, event);
        } catch (error) {
          this.logger.error(
            { error, eventId: event.id, eventType: event.type },
            'Handler error'
          );

          await this.emitFailureEvent(ctx, event, error);
          throw error;
        }
      }
    };

    const composed = this.composeMiddleware(this.middlewares, executeHandlers);

    try {
      await composed(ctx, event);
      this.logger.info(
        { eventId: event.id, eventType: event.type },
        'Event processed successfully'
      );
    } catch (error) {
      this.logger.error(
        { error, eventId: event.id, eventType: event.type },
        'Event processing failed'
      );
      throw error;
    }
  }

  private matchesPattern(event: Event, pattern: EventPattern): boolean {
    if (pattern.type) {
      if (typeof pattern.type === 'string' && event.type !== pattern.type) {
        return false;
      }
      if (pattern.type instanceof RegExp && !pattern.type.test(event.type)) {
        return false;
      }
    }

    if (pattern.source && event.source !== pattern.source) {
      return false;
    }

    if (pattern.user?.roles && event.user) {
      const hasRole = pattern.user.roles.some((role) =>
        event.user?.roles?.includes(role)
      );
      if (!hasRole) return false;
    }

    if (pattern.condition && !pattern.condition(event)) {
      return false;
    }

    return true;
  }

  private composeMiddleware(
    middlewares: Middleware[],
    final: (ctx: Context, event: Event) => Promise<void>
  ): (ctx: Context, event: Event) => Promise<void> {
    return middlewares.reduceRight(
      (next, middleware) => {
        return async (ctx: Context, event: Event) => {
          await middleware(ctx, event, () => next(ctx, event));
        };
      },
      final
    );
  }

  private async emitFailureEvent(
    ctx: Context,
    originalEvent: Event,
    error: any
  ): Promise<void> {
    try {
      const failureEvent: Event = {
        id: uuidv4(),
        type: 'event.processing.failed',
        payload: {
          originalEvent,
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
          },
        },
        created_at: new Date().toISOString(),
        source: 'sdk',
        trace_id: originalEvent.trace_id,
      };

      if (ctx.services.eventProducer) {
        await ctx.emit(failureEvent);
      }
    } catch (err) {
      this.logger.error({ err }, 'Failed to emit failure event');
    }
  }

  async start(): Promise<void> {
    this.logger.info('Starting application...');

    for (const adapter of this.adapters) {
      try {
        await adapter.start();
        this.logger.info({ adapter: adapter.name }, 'Adapter started');
      } catch (error) {
        this.logger.error(
          { error, adapter: adapter.name },
          'Failed to start adapter'
        );
        throw error;
      }
    }

    this.logger.info('Application started successfully');
  }

  async stop(): Promise<void> {
    this.logger.info('Stopping application...');

    for (const adapter of this.adapters) {
      try {
        await adapter.stop();
        this.logger.info({ adapter: adapter.name }, 'Adapter stopped');
      } catch (error) {
        this.logger.error(
          { error, adapter: adapter.name },
          'Failed to stop adapter'
        );
      }
    }

    this.logger.info('Application stopped');
  }
}
