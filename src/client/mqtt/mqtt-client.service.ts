import { Injectable } from '@nestjs/common';
import { IClient } from '../interfaces/client.interface';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class MqttClientService implements IClient {
  constructor(private httpService: HttpService) {}

  async dispatch<TPayload, TResult>(
    target: string,
    payload: TPayload,
  ): Promise<TResult> {}
}
