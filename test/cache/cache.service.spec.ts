import { Test, TestingModule } from '@nestjs/testing';
import { AxiosError, AxiosResponse } from 'axios';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheCheckResult, CacheService } from '../../src/cache/cache.service';
import {
  CacheBusinessRequest,
  CacheKeyService,
} from '../../src/cache/cache-key.service';
import { HttpClientService } from '../../src/client/http/http-client.service';

describe('CacheService', () => {
  let service: CacheService;
  let httpClientService: { get: jest.Mock; dispatch: jest.Mock };
  let keyService: { buildCacheKey: jest.Mock };
  let configService: { getOrThrow: jest.Mock };
  let loggerWarnSpy: jest.SpyInstance;

  const namespace = 'etl';
  const cacheUrl = '/v1/cache/';
  const generatedKey = 'abc123key';
  const request = {
    payload: 'https://example.com/file.pdf',
  } as CacheBusinessRequest;

  const buildHttpResponse = (status: number): AxiosResponse => ({
    status,
    statusText: '',
    headers: {},
    config: { headers: undefined },
    data: {},
  });

  beforeEach(async () => {
    process.env.CACHE_SERVICE_URL = cacheUrl;
    process.env.CACHE_NAMESPACE = namespace;

    httpClientService = {
      get: jest.fn(),
      dispatch: jest.fn(),
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
          provide: HttpClientService,
          useValue: httpClientService,
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
    delete process.env.CACHE_SERVICE_URL;
    delete process.env.CACHE_NAMESPACE;
    jest.clearAllMocks();
    loggerWarnSpy.mockRestore();
  });

  it('should map 404 from GET cache to MISS', async () => {
    httpClientService.get.mockResolvedValue(buildHttpResponse(404));

    const result = await service.check(request);

    expect(httpClientService.get).toHaveBeenCalledWith(
      `${cacheUrl}${namespace}/${generatedKey}`,
    );
    expect(result).toEqual<CacheCheckResult>({
      status: 'MISS',
      alreadyProcessed: false,
      key: generatedKey,
    });
  });

  it('should map 200 from GET cache to READY', async () => {
    httpClientService.get.mockResolvedValue(buildHttpResponse(200));

    const result = await service.check(request);

    expect(result).toEqual<CacheCheckResult>({
      status: 'READY',
      alreadyProcessed: true,
      key: generatedKey,
    });
  });

  it('should map 409 from GET cache to COMPUTING', async () => {
    httpClientService.get.mockResolvedValue(buildHttpResponse(409));

    const result = await service.check(request);

    expect(result).toEqual<CacheCheckResult>({
      status: 'COMPUTING',
      alreadyProcessed: true,
      key: generatedKey,
    });
  });

  it('should throw on unexpected GET status', async () => {
    httpClientService.get.mockResolvedValue(buildHttpResponse(500));

    await expect(service.check(request)).rejects.toThrow(
      'Unexpected cache GET status: 500',
    );
  });

  it('should publish to the expected endpoint', async () => {
    httpClientService.dispatch.mockResolvedValue(buildHttpResponse(200));

    await (
      service as CacheService & {
        publish: (request: CacheBusinessRequest) => Promise<void>;
      }
    ).publish(request);

    expect(httpClientService.dispatch).toHaveBeenCalledWith(
      `/v1/cache/${namespace}/${generatedKey}/publish`,
      {},
    );
  });

  it('should ignore 409 from publish', async () => {
    httpClientService.dispatch.mockResolvedValue(buildHttpResponse(409));

    await expect(
      (
        service as CacheService & {
          publish: (request: CacheBusinessRequest) => Promise<void>;
        }
      ).publish(request),
    ).resolves.toBeUndefined();
  });

  it('should swallow transport errors on publish and log warning', async () => {
    const networkError = new AxiosError('Network Error');
    httpClientService.dispatch.mockRejectedValue(networkError);

    await expect(
      (
        service as CacheService & {
          publish: (request: CacheBusinessRequest) => Promise<void>;
        }
      ).publish(request),
    ).resolves.toBeUndefined();
    expect(loggerWarnSpy).toHaveBeenCalledTimes(1);
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Cache publish failed'),
    );
  });
});
