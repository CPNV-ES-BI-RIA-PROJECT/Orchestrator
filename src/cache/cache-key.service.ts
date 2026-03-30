export interface CacheBusinessRequest {
  urlJson: Record<string, unknown>;
  paramsJson?: Record<string, unknown>;
}

export class CacheKeyService {
  buildCacheKey(request: CacheBusinessRequest) {
    return 1;
  }
}
