import { v4 as uuidv4 } from 'uuid';
import { Middleware } from '../core/types';

export function tracingMiddleware(): Middleware {
  return async (ctx, event, next) => {
    if (!event.trace_id) {
      event.trace_id = uuidv4();
    }

    ctx.meta.trace_id = event.trace_id;
    ctx.meta.start_time = Date.now();

    ctx.logger = ctx.logger.child({
      trace_id: event.trace_id,
      event_id: event.id,
      event_type: event.type,
    });

    try {
      await next();

      const duration = Date.now() - ctx.meta.start_time;
      ctx.logger.info(
        { duration, event_type: event.type },
        'Event processed'
      );
    } catch (error) {
      const duration = Date.now() - ctx.meta.start_time;
      ctx.logger.error(
        { error, duration, event_type: event.type },
        'Event processing failed'
      );
      throw error;
    }
  };
}
