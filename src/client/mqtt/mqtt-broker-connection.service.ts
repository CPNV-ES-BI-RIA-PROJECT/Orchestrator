import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type { connect as mqttConnectFn, MqttClient } from 'mqtt';
import clientConfig from '../config/client.config';
import { MQTT_CONNECT } from '../client.constants';
import {
  buildMqttEventSubscriptionTopic,
  extractMqttEventType,
  extractTargetFromTopic,
  getMqttErrorMessage,
  parseMqttEventPayload,
} from './mqtt.service';

interface PendingCompletion<TResult> {
  resolve: (value: TResult) => void;
  reject: (reason?: unknown) => void;
  timeout: NodeJS.Timeout;
  target: string;
}

type MqttConnect = typeof mqttConnectFn;

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
    @Inject(MQTT_CONNECT)
    private readonly mqttConnect: MqttConnect,
  ) {}

  onModuleInit(): void {
    if (this.config.protocol !== 'mqtt') {
      return;
    }
    const subscriptionTopic = buildMqttEventSubscriptionTopic(
      this.config.mqtt.namespace,
    );

    this.logger.log(
      `Connecting to MQTT broker at ${this.config.mqtt.brokerUrl}`,
    );
    this.mqttClient = this.mqttConnect(this.config.mqtt.brokerUrl);

    this.mqttClient.on('connect', () => {
      this.logger.log('Connected to MQTT broker');
      this.mqttClient?.subscribe(subscriptionTopic, (error) => {
        if (error) {
          this.logger.error(
            `Failed to subscribe to MQTT event topic ${subscriptionTopic}`,
            error instanceof Error ? error.stack : undefined,
          );
          return;
        }

        this.logger.log(`Subscribed to MQTT event topic ${subscriptionTopic}`);
      });
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
    const payload = parseMqttEventPayload(message);
    if (!payload) {
      this.logger.warn(`Ignoring invalid MQTT payload on topic ${topic}`);
      return;
    }

    const jobId = (payload as { job_id?: string }).job_id;
    if (!jobId) {
      return;
    }

    const pending = this.inflight.get(jobId);
    if (!pending) {
      return;
    }

    const target = extractTargetFromTopic(topic);
    if (!target || target !== pending.target) {
      return;
    }

    const eventType = extractMqttEventType(topic);
    if (!eventType || eventType === 'running') {
      return;
    }

    clearTimeout(pending.timeout);
    this.inflight.delete(jobId);

    if (eventType === 'completed') {
      pending.resolve(payload as never);
      return;
    }

    if (eventType === 'failed') {
      pending.reject(new Error(getMqttErrorMessage(payload)));
    }
  }
}
