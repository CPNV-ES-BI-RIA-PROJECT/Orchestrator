import { IClient } from '../interfaces/client.interface';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Injectable } from '@nestjs/common';

@Injectable()
export class HttpClientService implements IClient {
  constructor(private httpService: HttpService) {}

  async post<TPayload, TResult>(
    target: string,
    payload: TPayload,
  ): Promise<TResult> {
    const response = await firstValueFrom(
      this.httpService.post<TResult>(target, payload),
    );

    return response.data;
  }
}
