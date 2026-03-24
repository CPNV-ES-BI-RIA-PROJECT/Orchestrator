import { Injectable } from '@nestjs/common';
import { IClient } from '../interfaces/client.interface';
import { mqttService } from '@nestjs/axios';

@Injectable()
export class MqttClientService implements IClient {
  constructor(private mqttService: mqttService) {}

  async dispatch<TPayload, TResult>(
    target: string,
    payload: TPayload,
  ): Promise<TResult> {}
}
