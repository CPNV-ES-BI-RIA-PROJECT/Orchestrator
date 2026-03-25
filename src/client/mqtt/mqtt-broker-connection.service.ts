import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import mqtt, { MqttClient } from 'mqtt';
import clientConfig from '../config/client.config';

interface PendingCompletion<TResult> {
  resolve: (value: TResult) => void;
  reject: (reason?: unknown) => void;
  timeout: NodeJS.Timeout;
  target: string;
}

interface MqttEventPayload {
  job_id?: string;
  error?: { message?: string };
}

@Injectable()
export class MqttBrokerConnectionService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(MqttBrokerConnectionService.name);
  private readonly inflight = new Map<string, PendingCompletion<unknown>>();
  private mqttClient?: MqttClient;

  constructor(
    @Inject(clientConfig.KEY)
    private readonly config: ConfigType<typeof clientConfig>,
  ) {}

  onModuleInit(): void {
    if (this.config.protocol !== 'mqtt') {
      return;
    }
    this.mqttClient = mqtt.connect(this.config.mqtt.brokerUrl);

    this.mqttClient.on('connect', () => {
      this.mqttClient?.subscribe(
        `etl/${this.config.mqtt.namespace}/+/event/+`,
        (error) => {
          if (error) {
            this.logger.error(
              'Failed to subscribe to MQTT event topics',
              error,
            );
          }
        },
      );
    });

    this.mqttClient.on('message', (topic, message) => {
      this.handleMessage(topic, message);
    });

    this.mqttClient.on('error', (error) => {
      this.logger.error('MQTT broker connection error', error);
    });
  }

  onModuleDestroy(): void {
    if (!this.mqttClient) {
      return;
    }

    this.mqttClient.end(true);
    this.mqttClient = undefined;
  }

  waitForCompletion<TResult>(
    target: string,
    jobId: string,
    timeoutMs: number,
  ): Promise<TResult> {
    return new Promise<TResult>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.inflight.delete(jobId);
        reject(new Error('MQTT response timed out'));
      }, timeoutMs);

      this.inflight.set(jobId, { resolve, reject, timeout, target });
    });
  }

  private handleMessage(topic: string, message: Buffer): void {
    let payload: MqttEventPayload;

    try {
      payload = JSON.parse(message.toString()) as MqttEventPayload;
    } catch {
      this.logger.warn(`Ignoring invalid MQTT payload on topic ${topic}`);
      return;
    }

    const jobId = payload.job_id;
    if (!jobId) {
      return;
    }

    const pending = this.inflight.get(jobId);
    if (!pending) {
      return;
    }

    const target = this.extractTargetFromTopic(topic);
    if (!target || target !== pending.target) {
      return;
    }

    if (topic.endsWith('/event/running')) {
      return;
    }

    clearTimeout(pending.timeout);
    this.inflight.delete(jobId);

    if (topic.endsWith('/event/completed')) {
      pending.resolve(payload as never);
      return;
    }

    if (topic.endsWith('/event/failed')) {
      pending.reject(new Error(payload.error?.message ?? 'MQTT step failed'));
    }
  }

  private extractTargetFromTopic(topic: string): string | null {
    const parts = topic.split('/');

    if (parts.length < 5) {
      return null;
    }

    return parts[2] ?? null;
  }
}
