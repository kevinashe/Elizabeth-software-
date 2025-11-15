import {
  EventHubConsumerClient,
  EventHubProducerClient,
  ReceivedEventData,
} from '@azure/event-hubs';
import { DefaultAzureCredential } from '@azure/identity';
import { v4 as uuidv4 } from 'uuid';
import { App } from '../core/app';
import { Event, Adapter } from '../core/types';

export class EventHubsAdapter implements Adapter {
  name = 'event-hubs';
  private consumer: EventHubConsumerClient;
  private producer: EventHubProducerClient;
  private subscription?: any;

  constructor(
    private app: App,
    connectionStringOrNamespace: string,
    eventHubName: string,
    consumerGroup = '$Default',
    useConnectionString = false
  ) {
    const credential = new DefaultAzureCredential();

    if (useConnectionString) {
      this.consumer = new EventHubConsumerClient(
        consumerGroup,
        connectionStringOrNamespace,
        eventHubName
      );
      this.producer = new EventHubProducerClient(
        connectionStringOrNamespace,
        eventHubName
      );
    } else {
      const namespace = `${connectionStringOrNamespace}.servicebus.windows.net`;
      this.consumer = new EventHubConsumerClient(
        consumerGroup,
        namespace,
        eventHubName,
        credential
      );
      this.producer = new EventHubProducerClient(
        namespace,
        eventHubName,
        credential
      );
    }

    app.services.eventProducer = this.producer;
  }

  async start(): Promise<void> {
    this.app.logger.info('Starting Event Hubs consumer...');

    this.subscription = this.consumer.subscribe({
      processEvents: async (
        events: ReceivedEventData[],
        context
      ): Promise<void> => {
        for (const receivedEvent of events) {
          try {
            const body = receivedEvent.body;

            const event: Event = {
              id: body.id || uuidv4(),
              type: body.type || 'unknown',
              payload: body.payload || body,
              created_at: body.created_at || new Date().toISOString(),
              source: body.source || 'eventhubs',
              trace_id: body.trace_id,
              user: body.user,
              metadata: {
                partitionId: context.partitionId,
                sequenceNumber: receivedEvent.sequenceNumber,
                enqueuedTimeUtc: receivedEvent.enqueuedTimeUtc,
              },
            };

            await this.app.handleEvent(event);
          } catch (error) {
            this.app.logger.error(
              { error, event: receivedEvent },
              'Error processing Event Hub message'
            );
          }
        }
      },
      processError: async (error, context): Promise<void> => {
        this.app.logger.error(
          { error, partitionId: context.partitionId },
          'Event Hubs processing error'
        );
      },
    });

    this.app.logger.info('Event Hubs consumer started');
  }

  async stop(): Promise<void> {
    this.app.logger.info('Stopping Event Hubs adapter...');

    if (this.subscription) {
      await this.subscription.close();
    }

    await this.consumer.close();
    await this.producer.close();

    this.app.logger.info('Event Hubs adapter stopped');
  }
}
