import {
  CacheBusinessRequest,
  CacheKeyService,
} from '../../src/cache/cache-key.service';

describe('CacheKeyService', () => {
  let service: CacheKeyService;

  const baseRequest: CacheBusinessRequest = {
    urlJson: {
      url: 'https://example.com/input.csv',
    },
    paramsJson: {
      format: 'csv',
    },
  };

  beforeEach(() => {
    service = new CacheKeyService();
  });

  it('should produce the same key for the same business request', () => {
    const keyA = service.buildCacheKey(baseRequest);
    const keyB = service.buildCacheKey({ ...baseRequest });

    expect(keyA).toBe(keyB);
  });

  it('should be stable when object property order differs', () => {
    const reorderedRequest: CacheBusinessRequest = {
      paramsJson: {
        format: 'csv',
      },
      urlJson: {
        url: 'https://example.com/input.csv',
      },
    };

    const keyA = service.buildCacheKey(baseRequest);
    const keyB = service.buildCacheKey(reorderedRequest);

    expect(keyA).toBe(keyB);
  });

  it('should change key when url json changes', () => {
    const changed: CacheBusinessRequest = {
      ...baseRequest,
      urlJson: {
        ...baseRequest.urlJson,
        url: 'https://example.com/updated.csv',
      },
    };

    expect(service.buildCacheKey(changed)).not.toBe(
      service.buildCacheKey(baseRequest),
    );
  });

  it('should change key when params json changes', () => {
    const changed: CacheBusinessRequest = {
      ...baseRequest,
      paramsJson: {
        format: 'pdf',
      },
    };

    expect(service.buildCacheKey(changed)).not.toBe(
      service.buildCacheKey(baseRequest),
    );
  });

  it('should allow requests without params json', () => {
    const withoutParams: CacheBusinessRequest = {
      urlJson: {
        url: 'https://example.com/input.csv',
      },
    };

    expect(service.buildCacheKey(withoutParams)).toBeDefined();
  });
});
