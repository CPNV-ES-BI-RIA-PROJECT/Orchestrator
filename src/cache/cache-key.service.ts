import hash from 'object-hash';

export interface CacheBusinessRequest {
  urlJson: Record<string, string>;
  paramsJson?: Record<string, unknown>;
}

export class CacheKeyService {
  buildCacheKey(request: CacheBusinessRequest) {
    return hash(request);
  }
}
