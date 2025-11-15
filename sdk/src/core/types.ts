export type EventPayload = Record<string, any>;

export interface Event {
  id: string;
  type: string;
  payload: EventPayload;
  trace_id?: string;
  created_at: string;
  source?: string;
  user?: {
    id: string;
    email?: string;
    roles?: string[];
    [key: string]: any;
  };
  metadata?: Record<string, any>;
  idempotency_key?: string;
}

export interface Handler {
  (ctx: Context, event: Event): Promise<void>;
}

export interface Middleware {
  (ctx: Context, event: Event, next: () => Promise<void>): Promise<void>;
}

export interface AppConfig {
  serviceName: string;
  azure?: {
    subscriptionId?: string;
    resourceGroup?: string;
    keyVaultName?: string;
    eventHubsNamespace?: string;
    eventHubName?: string;
    serviceBusNamespace?: string;
    speechKey?: string;
    speechRegion?: string;
  };
  supabase?: {
    url: string;
    anonKey: string;
  };
  telemetry?: {
    enabled: boolean;
    serviceName: string;
  };
  http?: {
    port: number;
    basePath?: string;
  };
}

export interface Context {
  event: Event;
  services: ServiceRegistry;
  meta: Record<string, any>;
  logger: any;
  emit(event: Event): Promise<void>;
  getSecret(name: string): Promise<string>;
  persist(collection: string, data: any): Promise<any>;
  query(collection: string, filters?: Record<string, any>): Promise<any[]>;
}

export interface ServiceRegistry {
  eventProducer?: any;
  keyVault?: any;
  credential?: any;
  supabase?: any;
  [key: string]: any;
}

export interface Adapter {
  name: string;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export interface EventPattern {
  type?: string | RegExp;
  source?: string;
  user?: { roles?: string[] };
  condition?: (event: Event) => boolean;
}
