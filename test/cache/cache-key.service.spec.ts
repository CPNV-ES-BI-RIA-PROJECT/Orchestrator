import { CacheKeyService } from '../../src/cache/cache-key.service';

interface CacheBusinessRequest {
  businessParams: Record<string, unknown>;
  partitionWindow: string;
  upstreamFingerprint: string;
  workflowVersion: string;
  requestId?: string;
  runtimeTimestamp?: string;
  nonce?: string;
}

describe('CacheKeyService', () => {
  let service: CacheKeyService;

  const baseRequest: CacheBusinessRequest = {
    businessParams: {
      customerId: 'cust-123',
      source: 's3://bucket/input.csv',
      filters: {
        status: 'active',
        region: 'EU',
      },
    },
    partitionWindow: '2026-03-28',
    upstreamFingerprint: 'sha256:source-file-hash',
    workflowVersion: 'etl-v2.4.1',
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
      workflowVersion: baseRequest.workflowVersion,
      upstreamFingerprint: baseRequest.upstreamFingerprint,
      partitionWindow: baseRequest.partitionWindow,
      businessParams: {
        filters: {
          region: 'EU',
          status: 'active',
        },
        source: 's3://bucket/input.csv',
        customerId: 'cust-123',
      },
    };

    const keyA = service.buildCacheKey(baseRequest);
    const keyB = service.buildCacheKey(reorderedRequest);

    expect(keyA).toBe(keyB);
  });

  it('should change key when business parameters change', () => {
    const changed: CacheBusinessRequest = {
      ...baseRequest,
      businessParams: {
        ...baseRequest.businessParams,
        customerId: 'cust-999',
      },
    };

    expect(service.buildCacheKey(changed)).not.toBe(
      service.buildCacheKey(baseRequest),
    );
  });

  it('should change key when partition window changes', () => {
    const changed: CacheBusinessRequest = {
      ...baseRequest,
      partitionWindow: '2026-03-29',
    };

    expect(service.buildCacheKey(changed)).not.toBe(
      service.buildCacheKey(baseRequest),
    );
  });

  it('should change key when upstream fingerprint changes', () => {
    const changed: CacheBusinessRequest = {
      ...baseRequest,
      upstreamFingerprint: 'sha256:changed-input',
    };

    expect(service.buildCacheKey(changed)).not.toBe(
      service.buildCacheKey(baseRequest),
    );
  });

  it('should change key when workflow version changes', () => {
    const changed: CacheBusinessRequest = {
      ...baseRequest,
      workflowVersion: 'etl-v2.4.2',
    };

    expect(service.buildCacheKey(changed)).not.toBe(
      service.buildCacheKey(baseRequest),
    );
  });

  it('should ignore requestId in key generation', () => {
    const withRequestId: CacheBusinessRequest = {
      ...baseRequest,
      requestId: 'req-001',
    };

    const withDifferentRequestId: CacheBusinessRequest = {
      ...baseRequest,
      requestId: 'req-002',
    };

    expect(service.buildCacheKey(withRequestId)).toBe(
      service.buildCacheKey(withDifferentRequestId),
    );
  });

  it('should ignore runtime timestamp in key generation', () => {
    const withTimestampA: CacheBusinessRequest = {
      ...baseRequest,
      runtimeTimestamp: '2026-03-28T11:20:00.000Z',
    };

    const withTimestampB: CacheBusinessRequest = {
      ...baseRequest,
      runtimeTimestamp: '2026-03-28T11:21:00.000Z',
    };

    expect(service.buildCacheKey(withTimestampA)).toBe(
      service.buildCacheKey(withTimestampB),
    );
  });

  it('should ignore random nonce in key generation', () => {
    const withNonceA: CacheBusinessRequest = {
      ...baseRequest,
      nonce: 'random-aaa',
    };

    const withNonceB: CacheBusinessRequest = {
      ...baseRequest,
      nonce: 'random-bbb',
    };

    expect(service.buildCacheKey(withNonceA)).toBe(
      service.buildCacheKey(withNonceB),
    );
  });

  it('should match the golden SHA-256 vector of canonical JSON payload', () => {
    const key = service.buildCacheKey(baseRequest);

    expect(key).toBe(
      '2f93140b6d19dca8bd2ca76fca1475bec8fb53048369f98f8c3f83350f1955ad',
    );
  });
});
