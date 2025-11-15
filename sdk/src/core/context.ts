import { Event, ServiceRegistry } from './types';
import { EventHubProducerClient } from '@azure/event-hubs';
import { SecretClient } from '@azure/keyvault-secrets';
import pino from 'pino';

export class Context {
  event: Event;
  services: ServiceRegistry;
  meta: Record<string, any>;
  logger: pino.Logger;

  constructor(
    event: Event,
    services: ServiceRegistry = {},
    logger?: pino.Logger
  ) {
    this.event = event;
    this.services = services;
    this.meta = {};
    this.logger = logger || pino();
  }

  async emit(event: Event): Promise<void> {
    const producer = this.services.eventProducer as EventHubProducerClient;

    if (!producer) {
      throw new Error('No event producer configured');
    }

    try {
      const batch = await producer.createBatch();
      const added = batch.tryAdd({
        body: event,
        contentType: 'application/json',
      });

      if (!added) {
        throw new Error('Event too large for batch');
      }

      await producer.sendBatch(batch);

      this.logger.info(
        { eventId: event.id, eventType: event.type },
        'Event emitted'
      );
    } catch (error) {
      this.logger.error(
        { error, eventId: event.id, eventType: event.type },
        'Failed to emit event'
      );
      throw error;
    }
  }

  async getSecret(name: string): Promise<string> {
    const keyVault = this.services.keyVault as SecretClient;

    if (!keyVault) {
      throw new Error('Key Vault client not configured');
    }

    try {
      const secret = await keyVault.getSecret(name);
      return secret.value || '';
    } catch (error) {
      this.logger.error({ error, secretName: name }, 'Failed to retrieve secret');
      throw error;
    }
  }

  async persist(collection: string, data: any): Promise<any> {
    const supabase = this.services.supabase;

    if (!supabase) {
      throw new Error('Supabase client not configured');
    }

    const { data: result, error } = await supabase
      .from(collection)
      .insert(data)
      .select()
      .maybeSingle();

    if (error) {
      this.logger.error({ error, collection }, 'Failed to persist data');
      throw error;
    }

    return result;
  }

  async query(collection: string, filters: Record<string, any> = {}): Promise<any[]> {
    const supabase = this.services.supabase;

    if (!supabase) {
      throw new Error('Supabase client not configured');
    }

    let query = supabase.from(collection).select('*');

    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error({ error, collection, filters }, 'Failed to query data');
      throw error;
    }

    return data || [];
  }
}
