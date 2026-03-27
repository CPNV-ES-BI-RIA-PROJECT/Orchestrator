import { IClient } from '../interfaces/client.interface';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class HttpClientService implements IClient {
  private readonly logger = new Logger(HttpClientService.name);

  constructor(private httpService: HttpService) {}

  async post<TPayload, TResult>(
    target: string,
    payload: TPayload,
  ): Promise<TResult> {
    this.logger.debug(`Sending POST request to external target: ${target}`);
    const response = await firstValueFrom(
      this.httpService.post<TResult>(target, payload),
    );

    this.logger.debug(`Received successful response from: ${target}`);
    return response.data;
  }

  async postWithHeaders<TPayload, TResult>(
    target: string,
    payload: TPayload,
    headers: Record<string, string>,
  ): Promise<TResult> {
    this.logger.debug(`Sending POST request to external target: ${target}`);
    const response = await firstValueFrom(
      this.httpService.post<TResult>(target, payload, {
        headers: headers,
      }),
    );

    this.logger.debug(`Received successful response from: ${target}`);
    return response.data;
  }
}
