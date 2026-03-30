import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosError, AxiosResponse } from 'axios';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../../src/cache/cache.service';
import {
  CacheBusinessRequest,
  CacheKeyService,
} from '../../src/cache/cache-key.service';

type CacheStatus = 'MISS' | 'READY' | 'COMPUTING';

interface CacheCheckResult {
  status: CacheStatus;
  alreadyProcessed: boolean;
  key: string;
}

describe('CacheService', () => {
  let service: CacheService;
  let httpService: { get: jest.Mock; post: jest.Mock };
  let keyService: { buildCacheKey: jest.Mock };
  let configService: { getOrThrow: jest.Mock };
  let loggerWarnSpy: jest.SpyInstance;

  const namespace = 'etl';
  const generatedKey = 'abc123key';
  const request: CacheBusinessRequest = {
    urlJson: { url: 'https://example.com/file.pdf' },
  };

  const buildHttpResponse = (status: number): AxiosResponse => ({
    status,
    statusText: '',
    headers: {},
    config: { headers: undefined },
    data: {},
  });

  beforeEach(async () => {
    httpService = {
      get: jest.fn(),
      post: jest.fn(),
    };

    keyService = {
      buildCacheKey: jest.fn().mockReturnValue(generatedKey),
    };

    configService = {
      getOrThrow: jest.fn().mockReturnValue(namespace),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: HttpService,
          useValue: httpService,
        },
        {
          provide: CacheKeyService,
          useValue: keyService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    loggerWarnSpy.mockRestore();
  });

  it('should map 404 from GET cache to MISS', async () => {
    httpService.get.mockReturnValue(of(buildHttpResponse(404)));

    const result = await service.check(request);

    expect(httpService.get).toHaveBeenCalledWith(
      `/v1/cache/${namespace}/${generatedKey}`,
    );
    expect(result).toEqual<CacheCheckResult>({
      status: 'MISS',
      alreadyProcessed: false,
      key: generatedKey,
    });
  });

  it('should map 200 from GET cache to READY', async () => {
    httpService.get.mockReturnValue(of(buildHttpResponse(200)));

    const result = await service.check(request);

    expect(result).toEqual<CacheCheckResult>({
      status: 'READY',
      alreadyProcessed: true,
      key: generatedKey,
    });
  });

  it('should map 409 from GET cache to COMPUTING', async () => {
    httpService.get.mockReturnValue(of(buildHttpResponse(409)));

    const result = await service.check(request);

    expect(result).toEqual<CacheCheckResult>({
      status: 'COMPUTING',
      alreadyProcessed: true,
      key: generatedKey,
    });
  });

  it('should throw on unexpected GET status', async () => {
    httpService.get.mockReturnValue(of(buildHttpResponse(500)));

    await expect(service.check(request)).rejects.toThrow(
      'Unexpected cache GET status: 500',
    );
  });

  it('should publish to the expected endpoint', async () => {
    httpService.post.mockReturnValue(of(buildHttpResponse(200)));

    await service.publish(request);

    expect(httpService.post).toHaveBeenCalledWith(
      `/v1/cache/${namespace}/${generatedKey}/publish`,
      {},
    );
  });

  it('should ignore 409 from publish', async () => {
    httpService.post.mockReturnValue(of(buildHttpResponse(409)));

    await expect(service.publish(request)).resolves.toBeUndefined();
  });

  it('should swallow transport errors on publish and log warning', async () => {
    const networkError = new AxiosError('Network Error');
    httpService.post.mockReturnValue(throwError(() => networkError));

    await expect(service.publish(request)).resolves.toBeUndefined();
    expect(loggerWarnSpy).toHaveBeenCalledTimes(1);
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Cache publish failed'),
    );
  });

  it('should use namespace from env via ConfigService', async () => {
    httpService.get.mockReturnValue(of(buildHttpResponse(404)));

    await service.check(request);

    expect(configService.getOrThrow).toHaveBeenCalledWith('CACHE_NAMESPACE');
  });
});
