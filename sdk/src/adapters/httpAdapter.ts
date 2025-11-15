import express, { Express, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { App } from '../core/app';
import { Event, Adapter } from '../core/types';
import { Server } from 'http';

export class HttpAdapter implements Adapter {
  name = 'http';
  private expressApp: Express;
  private server?: Server;

  constructor(
    private app: App,
    private port: number,
    private basePath = ''
  ) {
    this.expressApp = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.expressApp.use(express.json({ limit: '10mb' }));
    this.expressApp.use(express.urlencoded({ extended: true }));

    this.expressApp.use((req, _res, next) => {
      const requestId = uuidv4();
      req.headers['x-request-id'] = requestId;

      this.app.logger.info(
        {
          method: req.method,
          path: req.path,
          requestId,
        },
        'HTTP request received'
      );

      next();
    });
  }

  private setupRoutes(): void {
    this.expressApp.get(`${this.basePath}/health`, (_req, res) => {
      res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    this.expressApp.post(
      `${this.basePath}/event`,
      async (req: Request, res: Response) => {
        try {
          const event = this.normalizeEvent(req.body, req);

          await this.app.handleEvent(event);

          res.status(202).json({
            status: 'accepted',
            id: event.id,
            trace_id: event.trace_id,
          });
        } catch (error: any) {
          this.app.logger.error({ error }, 'Error processing HTTP event');
          res.status(500).json({
            error: 'Internal server error',
            message: error.message,
          });
        }
      }
    );

    this.expressApp.post(
      `${this.basePath}/commands/:commandName`,
      async (req: Request, res: Response) => {
        try {
          const { commandName } = req.params;
          const event: Event = {
            id: uuidv4(),
            type: `command.${commandName}`,
            payload: req.body,
            created_at: new Date().toISOString(),
            source: 'http',
            trace_id: (req.headers['x-trace-id'] as string) || uuidv4(),
            user: (req as any).user,
          };

          await this.app.handleEvent(event);

          res.status(202).json({
            status: 'accepted',
            commandName,
            id: event.id,
          });
        } catch (error: any) {
          this.app.logger.error({ error }, 'Error processing command');
          res.status(500).json({
            error: 'Internal server error',
            message: error.message,
          });
        }
      }
    );
  }

  private normalizeEvent(body: any, req: Request): Event {
    return {
      id: body.id || uuidv4(),
      type: body.type || 'unknown',
      payload: body.payload || body,
      created_at: body.created_at || new Date().toISOString(),
      source: body.source || 'http',
      trace_id: body.trace_id || (req.headers['x-trace-id'] as string) || uuidv4(),
      user: body.user || (req as any).user,
      metadata: {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      },
    };
  }

  getExpressApp(): Express {
    return this.expressApp;
  }

  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.expressApp.listen(this.port, () => {
        this.app.logger.info(
          { port: this.port, basePath: this.basePath },
          'HTTP adapter listening'
        );
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err) => {
          if (err) {
            this.app.logger.error({ err }, 'Error stopping HTTP server');
            reject(err);
          } else {
            this.app.logger.info('HTTP adapter stopped');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}
