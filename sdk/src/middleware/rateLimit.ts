import { Middleware } from '../core/types';

export interface RateLimitConfig {
  maxEvents: number;
  windowMs: number;
  keyExtractor?: (event: any) => string;
}

export function rateLimitMiddleware(config: RateLimitConfig): Middleware {
  const requests = new Map<string, number[]>();

  const cleanup = () => {
    const now = Date.now();
    for (const [key, timestamps] of requests.entries()) {
      const valid = timestamps.filter((t) => now - t < config.windowMs);
      if (valid.length === 0) {
        requests.delete(key);
      } else {
        requests.set(key, valid);
      }
    }
  };

  setInterval(cleanup, config.windowMs);

  return async (ctx, event, next) => {
    const key = config.keyExtractor
      ? config.keyExtractor(event)
      : event.user?.id || event.source || 'anonymous';

    const now = Date.now();
    const timestamps = requests.get(key) || [];
    const recentRequests = timestamps.filter((t) => now - t < config.windowMs);

    if (recentRequests.length >= config.maxEvents) {
      ctx.logger.warn(
        {
          key,
          count: recentRequests.length,
          limit: config.maxEvents,
        },
        'Rate limit exceeded'
      );
      throw new Error('Rate limit exceeded');
    }

    recentRequests.push(now);
    requests.set(key, recentRequests);

    await next();
  };
}
