import { z, ZodSchema } from 'zod';
import { Middleware } from '../core/types';

export function validationMiddleware(
  schemas: Map<string, ZodSchema>
): Middleware {
  return async (ctx, event, next) => {
    const schema = schemas.get(event.type);

    if (!schema) {
      return next();
    }

    try {
      const validated = schema.parse(event.payload);
      event.payload = validated;

      ctx.logger.debug(
        { eventType: event.type },
        'Event payload validated'
      );

      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        ctx.logger.warn(
          {
            eventType: event.type,
            validationErrors: error.errors,
          },
          'Event validation failed'
        );

        throw new Error(`Validation failed: ${JSON.stringify(error.errors)}`);
      }
      throw error;
    }
  };
}
