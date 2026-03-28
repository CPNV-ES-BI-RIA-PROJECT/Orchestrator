import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import type { connect as mqttConnectFn, MqttClient } from 'mqtt';
import { IClient } from '../interfaces/client.interface';
import { MqttBrokerConnectionService } from './mqtt-broker-connection.service';
import clientConfig from '../config/client.config';
import { buildMqttCommandTopic, emitMqttCommand } from './mqtt.service';
import { MQTT_COMMAND_PUBLISHER, MQTT_CONNECT } from '../client.constants';

type MqttCommandPublisher = typeof emitMqttCommand;
type MqttConnect = typeof mqttConnectFn;

@Injectable()
export class MqttClientService implements IClient, OnModuleDestroy {
  private readonly mqttClient: MqttClient;

  constructor(
    @Inject(clientConfig.KEY)
    private readonly config: ConfigType<typeof clientConfig>,
    @Inject(MQTT_COMMAND_PUBLISHER)
    private readonly mqttCommandPublisher: MqttCommandPublisher,
    @Inject(MQTT_CONNECT)
    private readonly mqttConnect: MqttConnect,
    private readonly mqttBrokerConnectionService?: MqttBrokerConnectionService,
  ) {
    this.mqttClient = this.mqttConnect(this.config.mqtt.brokerUrl);
  }

  onModuleDestroy(): void {
    this.mqttClient.end(true);
  }

  async dispatch<TPayload, TResult>(
    target: string,
    payload: TPayload,
  ): Promise<TResult> {
    const topic = buildMqttCommandTopic(this.config.mqtt.namespace, target);
    const jobId = (payload as { job_id?: string }).job_id;

    if (jobId === undefined) {
      throw new Error('jobId is undefined');
    }

    await this.mqttCommandPublisher(this.mqttClient, topic, payload);

    return this.waitForCompletion(target, jobId);
  }

  private async waitForCompletion<TResult>(
    target: string,
    jobId: string,
  ): Promise<TResult> {
    if (!this.mqttBrokerConnectionService) {
      throw new Error('MQTT broker connection service is not available');
    }

    return this.mqttBrokerConnectionService.waitForCompletion<TResult>(
      target,
      jobId,
      this.config.mqtt.timeout,
    );
  }
}
