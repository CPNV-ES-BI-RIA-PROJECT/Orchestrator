import { IClient } from '../interfaces/client.interface';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class HttpClientService implements IClient {
  constructor(@Inject(HttpService) private readonly httpService: HttpService) {}

  async dispatch<TPayload, TResult>(
    target: string,
    payload: TPayload,
  ): Promise<TResult> {
    const response = await firstValueFrom(
      this.httpService.post<TResult>(target, payload),
    );

    return response.data;
  }

  async get<TResult>(target: string): Promise<TResult> {
    const response = await firstValueFrom(
      this.httpService.get<TResult>(target),
    );

    return response.data;
  }
}
