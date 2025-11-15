import { Middleware } from '../core/types';

export interface AuthConfig {
  requiredRoles?: string[];
  allowAnonymous?: boolean;
  publicEventTypes?: string[];
}

export function authenticationMiddleware(config: AuthConfig = {}): Middleware {
  return async (ctx, event, next) => {
    const isPublicEvent = config.publicEventTypes?.includes(event.type);

    if (isPublicEvent || config.allowAnonymous) {
      return next();
    }

    if (!event.user || !event.user.id) {
      ctx.logger.warn(
        { eventType: event.type },
        'Unauthorized event: missing user'
      );
      throw new Error('Unauthorized: user authentication required');
    }

    if (config.requiredRoles && config.requiredRoles.length > 0) {
      const userRoles = event.user.roles || [];
      const hasRequiredRole = config.requiredRoles.some((role) =>
        userRoles.includes(role)
      );

      if (!hasRequiredRole) {
        ctx.logger.warn(
          {
            eventType: event.type,
            userId: event.user.id,
            requiredRoles: config.requiredRoles,
            userRoles,
          },
          'Forbidden: insufficient roles'
        );
        throw new Error('Forbidden: insufficient permissions');
      }
    }

    ctx.logger.debug(
      { userId: event.user.id, roles: event.user.roles },
      'User authenticated'
    );

    await next();
  };
}
