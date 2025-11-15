import { Express } from 'express';
import {
  SpeechConfig,
  SpeechRecognizer,
  AudioConfig,
  ResultReason,
} from 'microsoft-cognitiveservices-speech-sdk';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { App } from '../core/app';
import { Event, Adapter } from '../core/types';

export interface VoiceNoteRequest {
  audioBase64?: string;
  audioUrl?: string;
  filename?: string;
  user?: any;
  metadata?: Record<string, any>;
}

export class SpeechAdapter implements Adapter {
  name = 'speech';
  private speechConfig: SpeechConfig;

  constructor(
    private app: App,
    private speechKey: string,
    private speechRegion: string
  ) {
    this.speechConfig = SpeechConfig.fromSubscription(
      this.speechKey,
      this.speechRegion
    );

    this.speechConfig.speechRecognitionLanguage = 'en-US';
  }

  bindToExpress(expressApp: Express, routePath = '/voice-note'): void {
    expressApp.post(routePath, async (req, res) => {
      try {
        const request = req.body as VoiceNoteRequest;

        if (!request.audioBase64) {
          return res.status(400).json({
            error: 'audioBase64 is required',
          });
        }

        const text = await this.transcribeAudio(request.audioBase64);

        const event: Event = {
          id: uuidv4(),
          type: 'voice.note.created',
          payload: {
            text,
            originalFilename: request.filename,
            metadata: request.metadata,
          },
          created_at: new Date().toISOString(),
          source: 'speech-adapter',
          user: request.user,
          trace_id: uuidv4(),
        };

        await this.app.handleEvent(event);

        return res.status(202).json({
          status: 'accepted',
          id: event.id,
          text,
        });
      } catch (error: any) {
        this.app.logger.error({ error }, 'Error processing voice note');
        return res.status(500).json({
          error: 'Failed to process voice note',
          message: error.message,
        });
      }
    });

    this.app.logger.info({ routePath }, 'Speech adapter route registered');
  }

  private async transcribeAudio(audioBase64: string): Promise<string> {
    const buffer = Buffer.from(audioBase64, 'base64');
    const tmpDir = '/tmp';
    const tmpPath = path.join(tmpDir, `${uuidv4()}.wav`);

    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }

      fs.writeFileSync(tmpPath, buffer);

      const audioConfig = AudioConfig.fromWavFileInput(
        fs.readFileSync(tmpPath)
      );
      const recognizer = new SpeechRecognizer(this.speechConfig, audioConfig);

      return new Promise((resolve, reject) => {
        recognizer.recognizeOnceAsync(
          (result) => {
            recognizer.close();

            if (result.reason === ResultReason.RecognizedSpeech) {
              this.app.logger.info(
                { text: result.text },
                'Speech recognized successfully'
              );
              resolve(result.text);
            } else {
              const error = `Speech recognition failed: ${result.reason}`;
              this.app.logger.error({ result }, error);
              reject(new Error(error));
            }

            try {
              fs.unlinkSync(tmpPath);
            } catch (err) {
              this.app.logger.warn({ err, tmpPath }, 'Failed to delete temp file');
            }
          },
          (error) => {
            recognizer.close();
            this.app.logger.error({ error }, 'Speech recognition error');

            try {
              fs.unlinkSync(tmpPath);
            } catch (err) {
              this.app.logger.warn({ err, tmpPath }, 'Failed to delete temp file');
            }

            reject(error);
          }
        );
      });
    } catch (error) {
      if (fs.existsSync(tmpPath)) {
        try {
          fs.unlinkSync(tmpPath);
        } catch (err) {
          this.app.logger.warn({ err, tmpPath }, 'Failed to delete temp file');
        }
      }
      throw error;
    }
  }

  async start(): Promise<void> {
    this.app.logger.info('Speech adapter initialized');
  }

  async stop(): Promise<void> {
    if (this.speechConfig && typeof this.speechConfig.close === 'function') {
      this.speechConfig.close();
    }
    this.app.logger.info('Speech adapter stopped');
  }
}
