import { Inject, Injectable, Logger } from '@nestjs/common';
import { AxiosError } from 'axios';
import { CacheBusinessRequest, CacheKeyService } from './cache-key.service';
import { HttpClientService } from '../client/http/http-client.service';

type CacheStatus = 'MISS' | 'READY' | 'COMPUTING';

interface CacheStatusResponse {
  status: number;
}

export interface CacheCheckResult {
  status: CacheStatus;
  alreadyProcessed: boolean;
  key: string;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(
    @Inject(CacheKeyService) private readonly cacheKeyService: CacheKeyService,
    @Inject(HttpClientService)
    private readonly httpClientService: HttpClientService,
  ) {}

  async check(request: CacheBusinessRequest): Promise<CacheCheckResult> {
    const key = this.cacheKeyService.buildCacheKey(request);
    const completedCacheUrl = this.buildCacheUrl(key);
    const cacheResult =
      await this.httpClientService.get<CacheStatusResponse>(completedCacheUrl);

    this.logger.debug('result received: ', cacheResult);

    return this.mapCacheCheckResult(cacheResult.status, key);
  }

  async publish(request: CacheBusinessRequest): Promise<void> {
    const key = this.cacheKeyService.buildCacheKey(request);
    const completedCacheUrl = this.buildCacheUrl(key) + '/publish';

    try {
      const cacheResult = await this.httpClientService.dispatch<
        Record<string, never>,
        CacheStatusResponse
      >(completedCacheUrl, {});

      this.logger.debug('result received: ', cacheResult);

      if (cacheResult.status === 200 || cacheResult.status === 409) {
        return;
      }

      this.logError(`Unexpected cache publish status: ${cacheResult.status}`);
    } catch (error) {
      if (error instanceof AxiosError) {
        this.logger.warn(`Cache publish failed: ${error.message}`);
        return;
      }

      throw error;
    }
  }

  private buildCacheUrl(key: string): string {
    const cacheUrl = this.getRequiredEnv('CACHE_SERVICE_URL');
    const cacheNamespace = this.getRequiredEnv('CACHE_NAMESPACE');

    return `${cacheUrl}${cacheNamespace}/${key}`;
  }

  private getRequiredEnv(
    name: 'CACHE_SERVICE_URL' | 'CACHE_NAMESPACE',
  ): string {
    const value = process.env[name];

    if (value !== undefined) {
      return value;
    }

    this.logError(`The environment variable "${name}" is not defined.`);
  }

  private mapCacheCheckResult(
    statusCode: number,
    key: string,
  ): CacheCheckResult {
    switch (statusCode) {
      case 404:
        return {
          alreadyProcessed: false,
          key,
          status: 'MISS',
        };
      case 409:
        return {
          alreadyProcessed: true,
          key,
          status: 'COMPUTING',
        };
      case 200:
        return {
          alreadyProcessed: true,
          key,
          status: 'READY',
        };
      default: {
        this.logError(`Unexpected cache GET status: ${statusCode}`);
      }
    }
  }

  private logError(message: string): never {
    this.logger.error(message);
    throw new Error(message);
  }
}
