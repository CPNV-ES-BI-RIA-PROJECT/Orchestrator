import {
  CacheBusinessRequest,
  CacheKeyService,
} from '../../src/cache/cache-key.service';

describe('CacheKeyService', () => {
  let service: CacheKeyService;

  const baseRequest = {
    payload: 'https://example.com/input.csv',
    json: {
      format: 'csv',
    },
  } as CacheBusinessRequest;

  beforeEach(() => {
    service = new CacheKeyService();
  });

  it('should produce the same key for the same business request', () => {
    const keyA = service.buildCacheKey(baseRequest);
    const keyB = service.buildCacheKey({ ...baseRequest });

    expect(keyA).toBe(keyB);
  });

  it('should be stable when object property order differs', () => {
    const reorderedRequest = {
      json: {
        format: 'csv',
      },
      payload: 'https://example.com/input.csv',
    } as CacheBusinessRequest;

    const keyA = service.buildCacheKey(baseRequest);
    const keyB = service.buildCacheKey(reorderedRequest);

    expect(keyA).toBe(keyB);
  });

  it('should change key when payload json changes', () => {
    const changed = {
      ...baseRequest,
      payload: 'https://example.com/updated.csv',
    } as CacheBusinessRequest;

    expect(service.buildCacheKey(changed)).not.toBe(
      service.buildCacheKey(baseRequest),
    );
  });

  it('should change key when params json changes', () => {
    const changed = {
      ...baseRequest,
      json: {
        format: 'pdf',
      },
    } as unknown as CacheBusinessRequest;

    expect(service.buildCacheKey(changed)).not.toBe(
      service.buildCacheKey(baseRequest),
    );
  });

  it('should allow requests without params json', () => {
    const withoutParams = {
      payload: 'https://example.com/input.csv',
    } as CacheBusinessRequest;

    expect(service.buildCacheKey(withoutParams)).toBeDefined();
  });
});
