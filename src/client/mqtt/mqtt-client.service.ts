import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { IClient } from '../interfaces/client.interface';
import { MqttBrokerConnectionService } from './mqtt-broker-connection.service';
import { MQTT_CLIENT } from '../client.constants';
import clientConfig from '../config/client.config';

@Injectable()
export class MqttClientService implements IClient {
  constructor(
    @Inject(MQTT_CLIENT) private readonly mqttClientProxy: ClientProxy,
    @Inject(clientConfig.KEY)
    private readonly config: ConfigType<typeof clientConfig>,
    private readonly mqttBrokerConnectionService?: MqttBrokerConnectionService,
  ) {}

  async dispatch<TPayload, TResult>(
    target: string,
    payload: TPayload,
  ): Promise<TResult> {
    const topic = `etl/${this.config.mqtt.namespace}/${target}/cmd/start`;
    const jobId = (payload as { job_id?: string } | undefined)?.job_id ?? '';

    this.mqttClientProxy.emit(topic, payload);

    return this.waitForCompletion(target, jobId);
  }

  private async waitForCompletion<TResult>(
    target: string,
    jobId: string,
  ): Promise<TResult> {
    if (!jobId) {
      throw new Error('MQTT payload must contain job_id');
    }

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
